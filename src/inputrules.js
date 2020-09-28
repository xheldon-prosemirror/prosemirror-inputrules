import {Plugin} from "prosemirror-state"

// ::- Input rules are regular expressions describing a piece of text
// that, when typed, causes something to happen. This might be
// changing two dashes into an emdash, wrapping a paragraph starting
// with `"> "` into a blockquote, or something entirely different.
//
// @cn 输入规则是一些正则表达式，描述了输入何种文本会引起一些额外的变化。这个变化可能是将两个短斜杠变成一个长破折号，或者将以 `"> "` 开头的段落用 blockquote 包裹着，
// 亦或者其他完全不一样的事情。
export class InputRule {
  // :: (RegExp, union<string, (state: EditorState, match: [string], start: number, end: number) → ?Transaction>)
  // Create an input rule. The rule applies when the user typed
  // something and the text directly in front of the cursor matches
  // `match`, which should probably end with `$`.
  //
  // @cn 创建一个输入规则。规则会应用到当用户输入一些内容的时候，且直接在光标之前的文本会匹配 `match` 参数，该参数应该合适的用 `$` 结尾。
  //
  // The `handler` can be a string, in which case the matched text, or
  // the first matched group in the regexp, is replaced by that
  // string.
  //
  // @cn `handler` 参数可以是一个字符串，这种情况下表示匹配的文本，或者在正则中匹配的第一个组，会被该字符串替换。
  //
  // Or a it can be a function, which will be called with the match
  // array produced by
  // [`RegExp.exec`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec),
  // as well as the start and end of the matched range, and which can
  // return a [transaction](#state.Transaction) that describes the
  // rule's effect, or null to indicate the input was not handled.
  //
  // @cn 它也可以是一个函数，会将调用 [`RegExp.exec`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec) 后产生的
  // 结果匹配数组传入作为参数来调用，以及匹配的起始和结束的范围。函数返回一个描述了规则影响的 [transaction](#state.Transaction)，或者如果输入没有被处理则返回 null。
  constructor(match, handler) {
    this.match = match
    this.handler = typeof handler == "string" ? stringHandler(handler) : handler
  }
}

function stringHandler(string) {
  return function(state, match, start, end) {
    let insert = string
    if (match[1]) {
      let offset = match[0].lastIndexOf(match[1])
      insert += match[0].slice(offset + match[1].length)
      start += offset
      let cutOff = start - end
      if (cutOff > 0) {
        insert = match[0].slice(offset - cutOff, offset) + insert
        start = end
      }
    }
    return state.tr.insertText(insert, start, end)
  }
}

const MAX_MATCH = 500

// :: (config: {rules: [InputRule]}) → Plugin
// Create an input rules plugin. When enabled, it will cause text
// input that matches any of the given rules to trigger the rule's
// action.
//
// @cn 创建一个输入规则插件。启用的话，将会导致与任何给定规则匹配的文本输入都会触发该规则对应的行为。
export function inputRules({rules}) {
  let plugin = new Plugin({
    state: {
      init() { return null },
      apply(tr, prev) {
        let stored = tr.getMeta(this)
        if (stored) return stored
        return tr.selectionSet || tr.docChanged ? null : prev
      }
    },

    props: {
      handleTextInput(view, from, to, text) {
        return run(view, from, to, text, rules, plugin)
      },
      handleDOMEvents: {
        compositionend: (view) => {
          setTimeout(() => {
            let {$cursor} = view.state.selection
            if ($cursor) run(view, $cursor.pos, $cursor.pos, "", rules, plugin)
          })
        }
      }
    },

    isInputRules: true
  })
  return plugin
}

function run(view, from, to, text, rules, plugin) {
  if (view.composing) return false
  let state = view.state, $from = state.doc.resolve(from)
  if ($from.parent.type.spec.code) return false
  let textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset,
                                            null, "\ufffc") + text
  for (let i = 0; i < rules.length; i++) {
    let match = rules[i].match.exec(textBefore)
    let tr = match && rules[i].handler(state, match, from - (match[0].length - text.length), to)
    if (!tr) continue
    view.dispatch(tr.setMeta(plugin, {transform: tr, from, to, text}))
    return true
  }
  return false
}

// :: (EditorState, ?(Transaction)) → bool
// This is a command that will undo an input rule, if applying such a
// rule was the last thing that the user did.
//
// @cn 如果应用这个规则是用户做的最后一件事情的话，这是一个可以撤销输入规则的命令。
export function undoInputRule(state, dispatch) {
  let plugins = state.plugins
  for (let i = 0; i < plugins.length; i++) {
    let plugin = plugins[i], undoable
    if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
      if (dispatch) {
        let tr = state.tr, toUndo = undoable.transform
        for (let j = toUndo.steps.length - 1; j >= 0; j--)
          tr.step(toUndo.steps[j].invert(toUndo.docs[j]))
        let marks = tr.doc.resolve(undoable.from).marks()
        dispatch(tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks)))
      }
      return true
    }
  }
  return false
}
