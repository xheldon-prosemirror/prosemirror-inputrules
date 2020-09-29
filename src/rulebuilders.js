import {InputRule} from "./inputrules"
import {findWrapping, canJoin} from "prosemirror-transform"

// :: (RegExp, NodeType, ?union<Object, ([string]) → ?Object>, ?([string], Node) → bool) → InputRule
// Build an input rule for automatically wrapping a textblock when a
// given string is typed. The `regexp` argument is
// directly passed through to the `InputRule` constructor. You'll
// probably want the regexp to start with `^`, so that the pattern can
// only occur at the start of a textblock.
//
// @cn 当给定字符串被输入的时候构建一个输入规则以自动包裹一个文本块。`regexp` 参数被直接传给 `InputRule` 构造函数。你也许想要正则表达式以 `^` 开头，
// 这样的话就只会从一个文本块起始位置开始匹配。
//
// @comment `^` 表示正则中的起始位置匹配，一般用来做类似于 markdown 的输入规则，例如在文本块开头输入 # + 空格后，生成一个 h 元素。
//
// `nodeType` is the type of node to wrap in. If it needs attributes,
// you can either pass them directly, or pass a function that will
// compute them from the regular expression match.
//
// @cn `nodeType` 是要被包裹进的节点类型。如果它需要 attributes，那么你既可以直接传入，也可以传入一个计算 attributes 的函数，该函数接受正则匹配的结果作为参数。
//
// By default, if there's a node with the same type above the newly
// wrapped node, the rule will try to [join](#transform.Transform.join) those
// two nodes. You can pass a join predicate, which takes a regular
// expression match and the node before the wrapped node, and can
// return a boolean to indicate whether a join should happen.
//
// @cn 默认情况下，如果有新的包裹节点之前有一个与之相同类型的节点，那么这个规则将会尝试 [join（连接）](#transform.Transform.join) 这两个节点。
// 你可以传递一个连接指示函数，它接受一个正则表达式的结果和在包裹节点之前的节点作为参数，返回一个指示连接是否应该进行的布尔值。
export function wrappingInputRule(regexp, nodeType, getAttrs, joinPredicate) {
  return new InputRule(regexp, (state, match, start, end) => {
    let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs
    let tr = state.tr.delete(start, end)
    let $start = tr.doc.resolve(start), range = $start.blockRange(), wrapping = range && findWrapping(range, nodeType, attrs)
    if (!wrapping) return null
    tr.wrap(range, wrapping)
    let before = tr.doc.resolve(start - 1).nodeBefore
    if (before && before.type == nodeType && canJoin(tr.doc, start - 1) &&
        (!joinPredicate || joinPredicate(match, before)))
      tr.join(start - 1)
    return tr
  })
}

// :: (RegExp, NodeType, ?union<Object, ([string]) → ?Object>) → InputRule
// Build an input rule that changes the type of a textblock when the
// matched text is typed into it. You'll usually want to start your
// regexp with `^` to that it is only matched at the start of a
// textblock. The optional `getAttrs` parameter can be used to compute
// the new node's attributes, and works the same as in the
// `wrappingInputRule` function.
//
// @cn 构建一个输入规则，以当匹配的文本输入的时候能够改变文本块的类型。你的正则通常应该以 `^` 开头，这样它就会只匹配文本块的起始位置。
// 可选参数 `getAttrs` 可以被用来计算新节点的 attributes，功能和 `wrappingInputRule` 中的该函数一样。
export function textblockTypeInputRule(regexp, nodeType, getAttrs) {
  return new InputRule(regexp, (state, match, start, end) => {
    let $start = state.doc.resolve(start)
    let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs
    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) return null
    return state.tr
      .delete(start, end)
      .setBlockType(start, start, nodeType, attrs)
  })
}
