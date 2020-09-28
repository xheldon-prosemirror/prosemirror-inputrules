This module defines a plugin for attaching _input rules_ to an editor,
which can react to or transform text typed by the user. It also comes
with a bunch of default rules that can be enabled in this plugin.

@cn 本模块定义了一个编辑器插件用来附加 _input rules（输入规则）_，它可以响应或者转换用户输入的文字。
本模块还带有一些默认的规则，可以通过本插件启用。

@InputRule
@inputRules
@undoInputRule

The module comes with a number of predefined rules:

@cn 本模块还带有一些预定义的规则：

@emDash
@ellipsis
@openDoubleQuote
@closeDoubleQuote
@openSingleQuote
@closeSingleQuote
@smartQuotes

These utility functions take schema-specific parameters and create
input rules specific to that schema.

@cn 下列这些工具函数接受一个特定于 schema 的参数，并创建一个特定于 schema 的输入规则。

@wrappingInputRule
@textblockTypeInputRule
