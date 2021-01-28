sap.ui.define(["ey/sap/fin/cs/deferredtaxrollfwd/controller/MainReport.controller",
	"ey/sap/fin/cs/deferredtaxrollfwd/Component", "sap/ui/core/Control", "sap/ui/model/json/JSONModel"
], function (
	MainReportController, Component, Control, JSONModel) {
	QUnit.module("Fetch Global parameters", {
		beforeEach: function () {
			this.oViewStub = new Control();
			this.oComponentStub = new Control();
			this.oComponentStub.setModel(new JSONModel());
			this.MainReportController = new MainReportController();
			sinon.stub(this.MainReportController, "getOwnerComponent").returns(this.oComponentStub);
			sinon.stub(this.MainReportController, "getView").returns(this.oViewStub);
			sinon.stub(this.oComponentStub, "getModel").returns(new sap.ui.model.odata.v2.ODataModel(
				"/sap/opu/odata/sap/Z_DEFERRED_TAX_ROLL_FORWARD_SRV/"));
			// sinon.stub(this.oViewStub, "getModel").withArgs("viewConfigDataModel").callsFake(() => {
			// 	return new JSONModel();
			// });

			// sinon.stub(this.oViewStub, "getModel",() => {
			// 	return new JSONModel();
			// });

			sinon.stub(this.oViewStub, "getModel").withArgs("viewConfigDataModel").returns(new JSONModel());

			let oReconDataModel = new JSONModel();
			var oComponentModelStub = sinon.stub(this.oComponentStub, "setModel");
			this.oComponentviewConfigModelStub = oComponentModelStub.withArgs(oReconDataModel, "viewConfigDataModel");

			this.oComponentviewConfigModelStub.getData = sinon.stub().returns({
				ConsolidationChartofAccounts: "Y1",
				ConsolidationUnit: "GB02",
				ConsolidationVersion: "Y10",
				FiscalYear: "2020",
				GroupCurrency: "",
				GroupCurrencyType: "",
				Intention: "Q1",
				LocalCurrency: "GBP",
				LocalCurrencyType: "Local",
				PeriodFrom: "001",
				PeriodTo: "003"
			});

		}
	});
	QUnit.test("Should get the global parameters", function (assert) {
		var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/Z_DEFERRED_TAX_ROLL_FORWARD_SRV/");
		var oData = {
			ConsolidationChartofAccounts: "Y1",
			ConsolidationUnit: "GB02",
			ConsolidationVersion: "Y10",
			FiscalYear: "2020",
			GroupCurrency: "",
			GroupCurrencyType: "",
			Intention: "Q1",
			LocalCurrency: "GBP",
			LocalCurrencyType: "Local",
			PeriodFrom: "001",
			PeriodTo: "003"
		};
		sinon.stub(oModel, "callFunction").yieldsTo("success", oData);
		this.MainReportController._fetchGlobalParameters();

		var sUnit = this.oComponentviewConfigModelStub.getData().ConsolidationUnit;
		assert.equal(sUnit, oData.ConsolidationUnit, "Test for global parameters passed");

	});
});