"use strict"

const {expect} = require("chai")
const {EOL} = require("os")
const generateCode = require("../src/code-builder")
const {pathFromModuleName} = require("../src/elm-utils")

describe("code-builder", () => {
    it("handles single file with one resources (no params)", () => test(
        {Translations: {hello: []}},
        {
            ["Translations"]: [`hello : Translations -> String
hello translations =
    t translations "hello"`]
        }))

    it("handles single file with one resource (one param)", () => test(
        {Translations: {"hello": ["name"]}},
        {
            ["Translations"]: [`hello : Translations -> String -> String
hello translations name =
    tr translations Curly "hello" [ ( "name", name ) ]`]
        }))

    it("handles single file with one resource (three params)", () => test(
        {Translations: {"hello": ["firstname", "middlename", "lastname"]}},
        {
            ["Translations"]: [`hello : Translations -> String -> String -> String -> String
hello translations firstname middlename lastname =
    tr translations Curly "hello" [ ( "firstname", firstname ), ( "middlename", middlename ), ( "lastname", lastname ) ]`]
        }))
})

const test = (model, expectedFiles) => {
    const actualFiles = generateCode(model)
    const expectedFilesBuilt = Object.keys(expectedFiles).reduce(
        (acc, module) => ({
            ...acc,
            [pathFromModuleName(module)]: getFileStart(module) + elmFunctionsArrayToString(expectedFiles[module]) + EOL
        }), {})
    expect(actualFiles).to.deep.equal(expectedFilesBuilt)
}

const elmFunctionsArrayToString = elmFunctions => elmFunctions.reduce(
    (module, fn) => module === "" ? fn : module + EOL + EOL + EOL + fn, "")

const getFileStart = moduleName => `module ${moduleName} exposing (..)

import I18Next exposing (Translations, t, tr, Curly)


`