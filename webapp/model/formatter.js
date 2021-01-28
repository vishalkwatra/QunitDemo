sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		convertStringToInt: function (sValue) {
			if (!sValue) {
				return "";
			}
			let iValue = parseInt(sValue, [10]);
			return iValue !== 0 ? iValue : "";
		},
		appendPercentageSign: function (sValue) {
			if (!sValue) {
				return "";
			}
			return sValue + " %";
		}

	};

});