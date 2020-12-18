"use strict"

const {expect, assert} = require("chai")
const buildModel = require("../src/model-builder")
const JsonError = require("../src/json-error")

describe("model-builder", () => {

    describe("basic model building", () => {
        it("handles single file with one resources (no params)", () => {
            expect(buildModel({"hello": "Hello"})).to.deep.equal({
                Translations: [{elmName: "hello", jsonName: "hello", type: "default", parameters: []}]
            })
        })

        it("handles single file with one resource (one param)", () => {
            expect(buildModel({"hello": "Hello {{name}}"})).to.deep.equal({
                Translations: [{
                    elmName: "hello",
                    jsonName: "hello",
                    type: "default",
                    parameters: [{elmName: "name", jsonName: "name"}]
                }]
            })
        })

        it("handles single file with one resources (three params)", () => {
            expect(buildModel({"hello": "Hello {{firstname}} {{middlename}} {{lastname}}!"})).to.deep.equal({
                Translations: [{
                    elmName: "hello", jsonName: "hello", type: "default", parameters: [
                        {elmName: "firstname", jsonName: "firstname"},
                        {elmName: "middlename", jsonName: "middlename"},
                        {elmName: "lastname", jsonName: "lastname"},
                    ]
                }]
            })
        })

        it("handles single submodule (no params)", () => {
            expect(buildModel({
                hello: "Hello",
                greetings: {
                    goodDay: "Good day."
                }
            })).to.deep.equal({
                Translations: [{
                    elmName: "hello", jsonName: "hello", type: "default", parameters: []
                }], "Translations.Greetings": [{
                    elmName: "goodDay", jsonName: "greetings.goodDay", type: "default", parameters: []
                }]
            })
        })

        it("handles multiple submodules (with and without params)", () => {
            expect(buildModel({
                hello: "Hello",
                helloWithParams: "Hello {{firstname}} {{middlename}} {{lastname}}!",
                greetings: {
                    goodDay: "Good day.",
                    welcome: "Hi {{name}}. Welcome to {{place}}.",
                    subNested: {
                        sn1: "SN1",
                        subSubNested: {
                            ssn1: "SSN1",
                            ssn2: "SSN2 {{ssnp1}} {{ssnp2}}",
                        },
                        sn2: "SN2 {{snp1}} {{snp2}}"
                    }
                },
                greetings2: {
                    goodDay2: "Good day.",
                    welcome2: "Hi {{name2}}. Welcome to {{place2}}."
                }
            })).to.deep.equal({
                Translations: [
                    {
                        elmName: "hello", jsonName: "hello", type: "default", parameters: []
                    },
                    {
                        elmName: "helloWithParams", jsonName: "helloWithParams", type: "default", parameters: [
                            {elmName: "firstname", jsonName: "firstname"},
                            {elmName: "middlename", jsonName: "middlename"},
                            {elmName: "lastname", jsonName: "lastname"}
                        ]
                    }
                ], "Translations.Greetings": [
                    {
                        elmName: "goodDay", jsonName: "greetings.goodDay", type: "default", parameters: []
                    },
                    {
                        elmName: "welcome", jsonName: "greetings.welcome", type: "default", parameters: [
                            {elmName: "name", jsonName: "name"},
                            {elmName: "place", jsonName: "place"}
                        ]
                    }
                ], "Translations.Greetings2": [
                    {
                        elmName: "goodDay2", jsonName: "greetings2.goodDay2", type: "default", parameters: []
                    },
                    {
                        elmName: "welcome2", jsonName: "greetings2.welcome2", type: "default", parameters: [
                            {elmName: "name2", jsonName: "name2"},
                            {elmName: "place2", jsonName: "place2"}
                        ]
                    }
                ], "Translations.Greetings.SubNested": [
                    {
                        elmName: "sn1", jsonName: "greetings.subNested.sn1", type: "default", parameters: []
                    },
                    {
                        elmName: "sn2", jsonName: "greetings.subNested.sn2", type: "default", parameters: [
                            {elmName: "snp1", jsonName: "snp1"},
                            {elmName: "snp2", jsonName: "snp2"}
                        ]
                    }
                ], "Translations.Greetings.SubNested.SubSubNested": [
                    {
                        elmName: "ssn1",
                        jsonName: "greetings.subNested.subSubNested.ssn1",
                        type: "default",
                        parameters: []
                    },
                    {
                        elmName: "ssn2",
                        jsonName: "greetings.subNested.subSubNested.ssn2",
                        type: "default",
                        parameters: [
                            {elmName: "ssnp1", jsonName: "ssnp1"},
                            {elmName: "ssnp2", jsonName: "ssnp2"}
                        ]
                    }
                ]
            })
        })

        it("handles duplicate parameter", () => {
            expect(buildModel({test: "test {{param1}} {{param2}} {{param1}} this"})).to.deep.equal({
                Translations: [{
                    elmName: "test",
                    jsonName: "test",
                    type: "default",
                    parameters: [
                        {elmName: "param1", jsonName: "param1"},
                        {elmName: "param2", jsonName: "param2"},
                    ]
                }]
            })
        })
    })

    describe("sanitisation", () => {
        describe("capitalisation", () => {
            it("capitalises first letter of module names", () => {
                expect(buildModel({
                    test: "",
                    nested: {
                        test: "",
                        subNested: {
                            test: "test"
                        }
                    }
                })).to.deep.equal({
                    Translations: [{elmName: "test", jsonName: "test", type: "default", parameters: []}],
                    "Translations.Nested": [{
                        elmName: "test",
                        jsonName: "nested.test",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.Nested.SubNested": [{
                        elmName: "test",
                        jsonName: "nested.subNested.test",
                        type: "default",
                        parameters: []
                    }]
                })
            })

            it("decapitalises first letter of function names", () => {
                expect(buildModel({
                    TestSomeValue: "",
                    nested: {
                        TestSomeOtherValue: "",
                        subNested: {
                            TestYetAnotherValue: "test"
                        }
                    }
                })).to.deep.equal({
                    Translations: [{
                        elmName: "testSomeValue",
                        jsonName: "TestSomeValue",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.Nested": [{
                        elmName: "testSomeOtherValue",
                        jsonName: "nested.TestSomeOtherValue",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.Nested.SubNested": [{
                        elmName: "testYetAnotherValue",
                        jsonName: "nested.subNested.TestYetAnotherValue",
                        type: "default",
                        parameters: []
                    }]
                })
            })

            it("decapitalises first letter of parameter names", () => {
                expect(buildModel({
                    testSomeValue: "some {{P1Abc}} {{P2Def}} value",
                    nested: {
                        testSomeOtherValue: "some {{P3Abc}} {{P4Def}} value",
                        subNested: {
                            testYetAnotherValue: "some {{P5Abc}} {{P6Def}} value"
                        }
                    }
                })).to.deep.equal({
                    Translations: [{
                        elmName: "testSomeValue", jsonName: "testSomeValue", type: "default", parameters: [
                            {elmName: "p1Abc", jsonName: "P1Abc"},
                            {elmName: "p2Def", jsonName: "P2Def"}
                        ]
                    }],
                    "Translations.Nested": [{
                        elmName: "testSomeOtherValue",
                        jsonName: "nested.testSomeOtherValue",
                        type: "default",
                        parameters: [
                            {elmName: "p3Abc", jsonName: "P3Abc"},
                            {elmName: "p4Def", jsonName: "P4Def"}
                        ]
                    }],
                    "Translations.Nested.SubNested": [{
                        elmName: "testYetAnotherValue",
                        jsonName: "nested.subNested.testYetAnotherValue",
                        type: "default",
                        parameters: [
                            {elmName: "p5Abc", jsonName: "P5Abc"},
                            {elmName: "p6Def", jsonName: "P6Def"}
                        ]
                    }]
                })
            })

            it("joins words and pascal cases module names", () => {
                expect(buildModel({
                    test: "",
                    "nested module": {
                        test: "",
                        "sub nested module": {
                            test: "test"
                        }
                    },
                    "dashed-nested-module": {
                        test: "",
                        "dashed-sub-nested-module": {
                            test: "test"
                        }
                    },
                    "underscore_nested_module": {
                        test: "",
                        "underscore_sub_nested_module": {
                            test: "test"
                        }
                    }
                })).to.deep.equal({
                    Translations: [{elmName: "test", jsonName: "test", type: "default", parameters: []}],
                    "Translations.NestedModule": [{
                        elmName: "test",
                        jsonName: "nested module.test",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.NestedModule.SubNestedModule": [{
                        elmName: "test",
                        jsonName: "nested module.sub nested module.test",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.DashedNestedModule": [{
                        elmName: "test",
                        jsonName: "dashed-nested-module.test",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.DashedNestedModule.DashedSubNestedModule": [{
                        elmName: "test",
                        jsonName: "dashed-nested-module.dashed-sub-nested-module.test",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.UnderscoreNestedModule": [{
                        elmName: "test",
                        jsonName: "underscore_nested_module.test",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.UnderscoreNestedModule.UnderscoreSubNestedModule": [{
                        elmName: "test",
                        jsonName: "underscore_nested_module.underscore_sub_nested_module.test",
                        type: "default",
                        parameters: []
                    }]
                })
            })

            it("joins words and camel cases function names", () => {
                expect(buildModel({
                    "test some value": "",
                    nested: {
                        "test-some other_value": "",
                        subNested: {
                            "test-yet another_value": "test"
                        }
                    }
                })).to.deep.equal({
                    Translations: [{
                        elmName: "testSomeValue",
                        jsonName: "test some value",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.Nested": [{
                        elmName: "testSomeOtherValue",
                        jsonName: "nested.test-some other_value",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.Nested.SubNested": [{
                        elmName: "testYetAnotherValue",
                        jsonName: "nested.subNested.test-yet another_value",
                        type: "default",
                        parameters: []
                    }]
                })
            })

            it("joins words and camel cases parameter names", () => {
                expect(buildModel({
                    testSomeValue: "some {{P1-abc_def ghi}} {{P2-abc_def ghi}} value",
                    nested: {
                        testSomeOtherValue: "some {{P3-abc_def ghi}} {{P4-abc_def ghi}} value",
                        subNested: {
                            testYetAnotherValue: "some {{P5-abc_def ghi}} {{P6-abc_def ghi}} value"
                        }
                    }
                })).to.deep.equal({
                    Translations: [{
                        elmName: "testSomeValue", jsonName: "testSomeValue", type: "default", parameters: [
                            {elmName: "p1AbcDefGhi", jsonName: "P1-abc_def ghi"},
                            {elmName: "p2AbcDefGhi", jsonName: "P2-abc_def ghi"}
                        ]
                    }],
                    "Translations.Nested": [{
                        elmName: "testSomeOtherValue",
                        jsonName: "nested.testSomeOtherValue",
                        type: "default",
                        parameters: [
                            {elmName: "p3AbcDefGhi", jsonName: "P3-abc_def ghi"},
                            {elmName: "p4AbcDefGhi", jsonName: "P4-abc_def ghi"}
                        ]
                    }],
                    "Translations.Nested.SubNested": [
                        {
                            elmName: "testYetAnotherValue",
                            jsonName: "nested.subNested.testYetAnotherValue",
                            type: "default",
                            parameters: [
                                {elmName: "p5AbcDefGhi", jsonName: "P5-abc_def ghi"},
                                {elmName: "p6AbcDefGhi", jsonName: "P6-abc_def ghi"}
                            ]
                        }]
                })
            })
        })

        describe("white space handling", () => {
            it("trims white space around module names", () => {
                expect(buildModel({
                    "  nested  ": {
                        test: "",
                        "  subNested  ": {
                            test: "",
                        }
                    }
                })).to.deep.equal({
                    "Translations.Nested": [{
                        elmName: "test",
                        jsonName: "  nested  .test",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.Nested.SubNested": [{
                        elmName: "test",
                        jsonName: "  nested  .  subNested  .test",
                        type: "default",
                        parameters: []
                    }],
                })
            })

            it("trims white space around function names", () => {
                expect(buildModel({
                    nested: {
                        "  test  ": "",
                        subNested: {
                            "\ttest\t": "",
                        }
                    }
                })).to.deep.equal({
                    "Translations.Nested": [{
                        elmName: "test",
                        jsonName: "nested.  test  ",
                        type: "default",
                        parameters: []
                    }],
                    "Translations.Nested.SubNested": [{
                        elmName: "test",
                        jsonName: "nested.subNested.\ttest\t",
                        type: "default",
                        parameters: []
                    }]
                })
            })

            it("trims white space around parameter names", () => {
                expect(buildModel({
                    nested: {
                        test: "some {{  p1  }} value",
                        subNested: {
                            test: "some {{  p2  }} value",
                        }
                    }
                })).to.deep.equal({
                    "Translations.Nested": [{
                        elmName: "test", jsonName: "nested.test", type: "default", parameters: [
                            {elmName: "p1", jsonName: "  p1  "}
                        ]
                    }],
                    "Translations.Nested.SubNested": [{
                        elmName: "test", jsonName: "nested.subNested.test", type: "default", parameters: [
                            {elmName: "p2", jsonName: "  p2  "}
                        ]
                    }]
                })
            })

            it("removes white space in module names", () => {
                expect(buildModel({"  Nested  Sub    Module  ": {test: ""}})).to.deep.equal({
                    "Translations.NestedSubModule": [{
                        elmName: "test", jsonName: "  Nested  Sub    Module  .test", type: "default", parameters: []
                    }]
                })
            })

            it("removes white space in function names", () => {
                expect(buildModel({"test  function  name": ""})).to.deep.equal({
                    "Translations": [{
                        elmName: "testFunctionName", jsonName: "test  function  name", type: "default", parameters: []
                    }]
                })
            })

            it("removes white space in parameter names", () => {
                expect(buildModel({test: "some {{param  1  a}} {{param  2  b}} value"})).to.deep.equal({
                    "Translations": [{
                        elmName: "test", jsonName: "test", type: "default", parameters: [
                            {elmName: "param1A", jsonName: "param  1  a"},
                            {elmName: "param2B", jsonName: "param  2  b"}
                        ]
                    }]
                })
            })

            it("ignores parameters with just white space", () => {
                expect(buildModel({"key": "some {{   \t   }} value"})).to.deep.equal({
                    Translations: [{elmName: "key", jsonName: "key", type: "default", parameters: []}]
                })
            })

            it("allows empty translation", () => {
                expect(buildModel({test: ""})).to.deep.equal({
                    "Translations": [{elmName: "test", jsonName: "test", type: "default", parameters: []}]
                })
            })
        })

        describe("illegal character replacement", () => {
            it("removes illegal characters in module name", () => {
                expect(buildModel({"!Abc$.-_%:Def&": {test: ""}})).to.deep.equal({
                    "Translations.AbcDef": [{
                        elmName: "test",
                        jsonName: "!Abc$.-_%:Def&.test",
                        type: "default",
                        parameters: []
                    }]
                })
            })

            it("removes illegal characters in function name", () => {
                expect(buildModel({"!Abc$.-_%:def&": ""})).to.deep.equal({
                    "Translations": [{elmName: "abcDef", jsonName: "!Abc$.-_%:def&", type: "default", parameters: []}]
                })
            })

            it("removes illegal characters in parameter name", () => {
                expect(buildModel({test: "test {{!Abc$.-_%:def&}} value"})).to.deep.equal({
                    "Translations": [{
                        elmName: "test",
                        jsonName: "test",
                        type: "default",
                        parameters: [{elmName: "abcDef", jsonName: "!Abc$.-_%:def&"}]
                    }]
                })
            })

            it("prefixes numbers in module/function/parameter", () => {
                expect(buildModel({"12": {"34": "some {{56}} {{78}} value"}})).to.deep.equal({
                    "Translations.T12": [{
                        elmName: "t34", jsonName: "12.34", type: "default", parameters: [
                            {elmName: "t56", jsonName: "56"},
                            {elmName: "t78", jsonName: "78"}
                        ]
                    }]
                })
            })

            it("ignores blank parameters", () => {
                expect(buildModel({test: "some {{}} value {{  }}"})).to.deep.equal({
                    "Translations": [{elmName: "test", jsonName: "test", type: "default", parameters: []}]
                })
            })
        })

        describe("translation type", () => {
            it("only generates default function if 'default' type supplied", () => {
                expect(buildModel({"hello": "Hello"}, "default")).to.deep.equal({
                    Translations: [{elmName: "hello", jsonName: "hello", type: "default", parameters: []}]
                })
            })

            it("only generates custom function if 'custom' type supplied", () => {
                expect(buildModel({"hello": "Hello"}, "custom")).to.deep.equal({
                    Translations: [{elmName: "hello", jsonName: "hello", type: "custom", parameters: []}]
                })
            })

            it("generates default and custom functions if 'both' type supplied", () => {
                expect(buildModel({"hello": "Hello"}, "both")).to.deep.equal({
                    Translations: [
                        {elmName: "hello", jsonName: "hello", type: "default", parameters: []},
                        {elmName: "helloCustom", jsonName: "hello", type: "custom", parameters: []}
                    ]
                })
            })

            it("generates default and custom functions if 'both' type supplied, nested", () => {
                expect(buildModel({
                    hello: "Hello",
                    greetings: {
                        goodDay: "Good day."
                    }
                }, "both")).to.deep.equal({
                    Translations: [
                        {elmName: "hello", jsonName: "hello", type: "default", parameters: []},
                        {elmName: "helloCustom", jsonName: "hello", type: "custom", parameters: []}
                    ], "Translations.Greetings": [
                        {elmName: "goodDay", jsonName: "greetings.goodDay", type: "default", parameters: []},
                        {elmName: "goodDayCustom", jsonName: "greetings.goodDay", type: "custom", parameters: []}
                    ]
                })
            })

            it("handles default/custom name conflict if in different modules", () => {
                expect(buildModel({
                    hello: "Hello",
                    greetings: {
                        helloCustom: "Hello custom"
                    }
                }, "both")).to.deep.equal({
                    Translations: [
                        {elmName: "hello", jsonName: "hello", type: "default", parameters: []},
                        {elmName: "helloCustom", jsonName: "hello", type: "custom", parameters: []}
                    ], "Translations.Greetings": [
                        {elmName: "helloCustom", jsonName: "greetings.helloCustom", type: "default", parameters: []},
                        {
                            elmName: "helloCustomCustom",
                            jsonName: "greetings.helloCustom",
                            type: "custom",
                            parameters: []
                        }
                    ]
                })
            })
        })

        describe("error handling", () => {
            it("throws error if module name blank", () => {
                assert.throws(
                    () => buildModel({"  ": {test: ""}}),
                    JsonError,
                    "The supplied JSON file has a problem in it: a module with no ID was found."
                )
            })

            it("throws error if module has no valid characters", () => {
                // noinspection NonAsciiCharacters
                assert.throws(
                    () => buildModel({" !^&£$ ": {test: ""}}),
                    JsonError,
                    "The supplied JSON file has a problem in it: ' !^&£$ ' is not a valid module name."
                )
            })

            it("throws error if function name blank", () => {
                assert.throws(
                    () => buildModel({test: {"  ": ""}}),
                    JsonError,
                    "The supplied JSON file has a problem in it: a function with no ID was found."
                )
            })

            it("throws error if function has no valid characters", () => {
                // noinspection NonAsciiCharacters
                assert.throws(
                    () => buildModel({" !^&£$ ": ""}),
                    JsonError,
                    "The supplied JSON file has a problem in it: ' !^&£$ ' is not a valid function name."
                )
            })

            it("throws error if parameter has no valid characters", () => {
                // noinspection NonAsciiCharacters
                assert.throws(
                    () => buildModel({test: "some {{!^&£$}} value"}),
                    JsonError,
                    "The supplied JSON file has a problem in it: '!^&£$' is not a valid parameter name."
                )
            })

            it("throws error on duplicate module name", () => {
                assert.throws(
                    () => buildModel({"^Test": {test: ""}, "!Test": {test: ""}}),
                    JsonError,
                    "The supplied JSON file has a problem in it: duplicate module found: 'Translations.Test'."
                )
            })

            it("throws error on duplicate function name", () => {
                assert.throws(
                    () => buildModel({"^test": "", "!Test": ""}),
                    JsonError,
                    "The supplied JSON file has a problem in it: duplicate function found: 'test' (in module 'Translations')."
                )
            })

            it("throws error on custon/default function name conflict", () => {
                assert.throws(
                    () => buildModel({"hello": "Hello", "helloCustom": "Hello Custom"}, "both"),
                    JsonError,
                    "The supplied JSON file has a problem in it: duplicate function found: 'helloCustom' (in module 'Translations')."
                )
            })
        })
    })
})
