import {InputRule} from "./inputrules"

// :: InputRule Converts double dashes to an emdash.
//
// @cn 转换两个短斜杠为一个长破折号的输入规则。
export const emDash = new InputRule(/--$/, "—")
// :: InputRule Converts three dots to an ellipsis character.
//
// @cn 转换三个点为一个省略号的输入规则。
export const ellipsis = new InputRule(/\.\.\.$/, "…")
// :: InputRule “Smart” opening double quotes.
//
// @cn 「智能」打开双引号的输入规则。
export const openDoubleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“")
// :: InputRule “Smart” closing double quotes.
//
// @cn 「智能」关闭双引号的输入规则。
export const closeDoubleQuote = new InputRule(/"$/, "”")
// :: InputRule “Smart” opening single quotes.
//
// @cn 「智能」打开单引号的输入规则。
export const openSingleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘")
// :: InputRule “Smart” closing single quotes.
//
// @cn 「智能」关闭单引号的输入规则。
export const closeSingleQuote = new InputRule(/'$/, "’")

// :: [InputRule] Smart-quote related input rules.
//
// @cn 自动打开/关闭 单/双 引号相关的输入规则。
export const smartQuotes = [openDoubleQuote, closeDoubleQuote, openSingleQuote, closeSingleQuote]
