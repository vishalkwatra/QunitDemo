/*global QUnit*/

sap.ui.define([
	"ey/sap/fin/cs/deferredtaxrollfwd/model/formatter"
], function (formatter) {
	"use strict";

	QUnit.module("Number unit");

	function numberUnitValueTestCase(assert, sValue, fExpectedNumber) {
		// Act
		var fNumber = formatter.numberUnit(sValue);

		// Assert
		assert.strictEqual(fNumber, fExpectedNumber, "The rounding was correct");
	}

	QUnit.test("Should round down a 3 digit number", function (assert) {
		numberUnitValueTestCase.call(this, assert, "3.123", "3.12");
	});

	QUnit.test("Should round up a 3 digit number", function (assert) {
		numberUnitValueTestCase.call(this, assert, "3.128", "3.13");
	});

	QUnit.test("Should round a negative number", function (assert) {
		numberUnitValueTestCase.call(this, assert, "-3", "-3.00");
	});

	QUnit.test("Should round an empty string", function (assert) {
		numberUnitValueTestCase.call(this, assert, "", "");
	});

	QUnit.test("Should round a zero", function (assert) {
		numberUnitValueTestCase.call(this, assert, "0", "0.00");
	});
	
	QUnit.module("Convert String to Int");
	function convertStringtoIntTestCase(assert, sValue, fExpectedNumber){
		var number = formatter.convertStringToInt(sValue);
		assert.strictEqual(number,fExpectedNumber,"The String was converted to Int");
	}
	QUnit.test("Should convert a positive String to Int", function(assert){
		convertStringtoIntTestCase.call(this, assert, "5", 5);               
	});
	
	QUnit.test("Should convert a negative String to Int", function(assert){
		convertStringtoIntTestCase.call(this, assert, "-5", -5);               
	});

});