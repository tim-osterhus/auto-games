import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class IronLanternDescentCinderVentNetworkTests(unittest.TestCase):
    def test_vent_network_data_extends_progression_and_scanner_targeting(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 131 });
            const cinder = state.ventSites.find((site) => site.id === "vent-cinder-rib-draft");
            state.player.position = { x: cinder.position.x, y: 1.6, z: cinder.position.z };
            state.elapsed = 72;
            state = game.pulseScanner(game.syncDerivedState(state));
            const nearest = game.nearestVentSite(state);

            console.log(JSON.stringify({
              release: state.ventNetwork.release.label,
              baseRelease: state.ventNetwork.release.baseRelease,
              pumpworksRelease: state.pumpworks.release.label,
              passageIds: game.GAME_DATA.cave.passages.map((passage) => passage.id),
              collisionPassage: state.movement.collision.lastPassage,
              ventCount: state.ventSites.length,
              nearestVent: nearest.site.id,
              activeVent: state.ventNetwork.activeSiteId,
              scannerKind: state.scanner.targetKind,
              scannerPulseKind: state.scanner.lastPulse.targetKind,
              scannerPulseWindow: state.scanner.lastPulse.ventWindow,
              scannerPulseStatus: state.scanner.lastPulse.ventStatus,
              cinderGate: cinder.gateId,
              cinderFan: cinder.fanId,
              cinderRequirement: cinder.requirements,
              cinderGas: cinder.airflow.baseGasPressure,
              contractRelays: state.ventNetwork.contract.targetRelays,
              contractGas: state.ventNetwork.contract.targetGasCleared,
              contractMap: state.ventNetwork.contract.targetMapProgress,
              filters: state.ventNetwork.filters,
            }));
            """
        )

        self.assertEqual("v0.3.0 Cinder Vent Network", result["release"])
        self.assertEqual("v0.2.0 Deep Pumpworks", result["baseRelease"])
        self.assertEqual("v0.2.0 Deep Pumpworks", result["pumpworksRelease"])
        self.assertIn("cinder-vent-shaft", result["passageIds"])
        self.assertIn("fan-relay-bay", result["passageIds"])
        self.assertEqual("cinder-vent-shaft", result["collisionPassage"])
        self.assertGreaterEqual(result["ventCount"], 2)
        self.assertEqual("vent-cinder-rib-draft", result["nearestVent"])
        self.assertEqual("vent-cinder-rib-draft", result["activeVent"])
        self.assertEqual("vent-network", result["scannerKind"])
        self.assertEqual("vent-network", result["scannerPulseKind"])
        self.assertEqual("draft", result["scannerPulseWindow"])
        self.assertEqual("draft ready", result["scannerPulseStatus"])
        self.assertEqual("gate-cinder-rib", result["cinderGate"])
        self.assertEqual("fan-cinder-draft", result["cinderFan"])
        self.assertEqual("survey-cinder-rib", result["cinderRequirement"]["surveySiteId"])
        self.assertEqual("pump-cinder-sump", result["cinderRequirement"]["pumpworksSiteId"])
        self.assertEqual("partial", result["cinderRequirement"]["chart"])
        self.assertEqual("partial", result["cinderRequirement"]["pumpworksDrainage"])
        self.assertGreater(result["cinderGas"], 0.4)
        self.assertEqual(2, result["contractRelays"])
        self.assertEqual(2, result["contractGas"])
        self.assertEqual(3, result["contractMap"])
        self.assertEqual(1, result["filters"])

    def test_cinder_gate_fan_and_gas_venting_tie_to_survey_pumpworks_route_and_samples(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 137 });
            const survey = state.surveySites.find((site) => site.id === "survey-cinder-rib");
            state.player.position = { x: survey.position.x, y: 1.6, z: survey.position.z };
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.plantSurveyStake(state, "survey-cinder-rib");
            state = game.chartFaultSurvey(state, "survey-cinder-rib");

            const pump = state.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            state.player.position = { x: pump.position.x, y: 1.6, z: pump.position.z };
            state.elapsed = 50;
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.primePumpStation(state, "pump-cinder-sump");
            state = game.turnPressureValve(state, "pump-cinder-sump");

            const vent = state.ventSites.find((site) => site.id === "vent-cinder-rib-draft");
            state.player.position = { x: vent.position.x, y: 1.6, z: vent.position.z };
            state.elapsed = 70;
            state = game.syncDerivedState(state);
            const before = {
              drain: game.oxygenDrainRate(state),
              oxygen: state.oxygen.current,
              stability: state.routeStability.stability,
              routeConfidence: state.route.returnConfidence,
            };
            state = game.openDraftGate(state, "vent-cinder-rib-draft");
            const gated = JSON.parse(JSON.stringify(state));
            state = game.startPressureFan(state, "vent-cinder-rib-draft");
            const fan = JSON.parse(JSON.stringify(state));
            state = game.ventGasPocket(state, "vent-cinder-rib-draft");
            const vented = JSON.parse(JSON.stringify(state));

            const node = state.sampleNodes.find((entry) => entry.id === "sample-deep-lode");
            state.player.position = { x: node.position.x, y: 1.6, z: node.position.z };
            state = game.syncDerivedState(state);
            for (let pass = 0; pass < 3; pass += 1) {
              state = game.mineNearestSample(state, 1);
            }

            console.log(JSON.stringify({
              before,
              gateState: gated.ventSites[0].gateState,
              gateGas: gated.ventSites[0].gasPressure,
              fanState: fan.ventSites[0].fanState,
              relayState: vented.ventSites[0].relayState,
              gasState: vented.ventSites[0].gasState,
              gasPressure: vented.ventSites[0].gasPressure,
              staleAirPressure: vented.ventSites[0].staleAirPressure,
              ventValue: vented.ventNetwork.value,
              ventMap: vented.ventNetwork.mapProgress,
              airflowRelief: vented.ventNetwork.airflowRelief,
              relaysOnline: vented.ventNetwork.relaysOnline,
              gasCleared: vented.ventNetwork.gasCleared,
              routeAfter: vented.route.returnConfidence,
              stabilityAfter: vented.routeStability.stability,
              oxygenAfter: vented.oxygen.current,
              drainAfter: game.oxygenDrainRate(vented),
              sampleBonus: game.sampleVentValueBonus(vented, node),
              minedValue: state.cargo.value,
              lastYield: state.sampleNodes.find((entry) => entry.id === "sample-deep-lode").mineState.lastYield,
              routeGuideKinds: game.routeGuidePoints(vented).map((point) => point.kind),
              lastLog: vented.log[0].message,
            }));
            """
        )

        self.assertEqual("open", result["gateState"])
        self.assertLess(result["gateGas"], 0.48)
        self.assertEqual("running", result["fanState"])
        self.assertEqual("success", result["relayState"])
        self.assertEqual("cleared", result["gasState"])
        self.assertLess(result["gasPressure"], 0.2)
        self.assertLess(result["staleAirPressure"], 0.2)
        self.assertEqual(72, result["ventValue"])
        self.assertEqual(1, result["ventMap"])
        self.assertEqual(18, result["airflowRelief"])
        self.assertEqual(1, result["relaysOnline"])
        self.assertEqual(1, result["gasCleared"])
        self.assertGreater(result["routeAfter"], result["before"]["routeConfidence"])
        self.assertGreater(result["stabilityAfter"], result["before"]["stability"])
        self.assertLess(result["oxygenAfter"], result["before"]["oxygen"])
        self.assertLess(result["drainAfter"], result["before"]["drain"])
        self.assertEqual(9, result["sampleBonus"])
        self.assertEqual(89, result["minedValue"])
        self.assertEqual(89, result["lastYield"])
        self.assertIn("vent-relay", result["routeGuideKinds"])
        self.assertIn("gas pocket success", result["lastLog"])

    def test_basalt_filter_relay_lift_banking_and_restart_carryover(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 139 });
            const survey = state.surveySites.find((site) => site.id === "survey-basalt-suture");
            state.player.position = { x: survey.position.x, y: 1.6, z: survey.position.z };
            state.elapsed = 50;
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.plantSurveyStake(state, "survey-basalt-suture");
            state = game.braceSurveySite(state, "survey-basalt-suture");
            state = game.chartFaultSurvey(state, "survey-basalt-suture");

            const pump = state.pumpworksSites.find((site) => site.id === "pump-basalt-gate");
            state.player.position = { x: pump.position.x, y: 1.6, z: pump.position.z };
            state.elapsed = 70;
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.sealLeakSeam(state, "pump-basalt-gate");
            state = game.deploySiphonCharge(state, "pump-basalt-gate");
            state = game.primePumpStation(state, "pump-basalt-gate");
            state = game.turnPressureValve(state, "pump-basalt-gate");

            const vent = state.ventSites.find((site) => site.id === "vent-basalt-relay-bay");
            state.player.position = { x: vent.position.x, y: 1.6, z: vent.position.z };
            state.elapsed = 92;
            state = game.placeLantern(game.syncDerivedState(state));
            const beforeRelay = {
              filters: state.ventNetwork.filters,
              stability: state.routeStability.stability,
              drain: game.oxygenDrainRate(state),
            };
            state = game.openDraftGate(state, "vent-basalt-relay-bay");
            state = game.deployFilterCartridge(state, "vent-basalt-relay-bay");
            state = game.startPressureFan(state, "vent-basalt-relay-bay");
            state = game.ventGasPocket(state, "vent-basalt-relay-bay");
            const vented = JSON.parse(JSON.stringify(state));

            state.player.position = { x: state.lift.position.x, y: 1.6, z: state.lift.position.z };
            state = game.returnToLift(game.syncDerivedState(state));
            const afterLift = JSON.parse(JSON.stringify(state));
            const restarted = game.resetRun(state);

            console.log(JSON.stringify({
              beforeRelay,
              gateState: vented.ventSites[1].gateState,
              filterState: vented.ventSites[1].filterState,
              filterDeployed: vented.ventSites[1].filterDeployed,
              fanState: vented.ventSites[1].fanState,
              relayState: vented.ventSites[1].relayState,
              gasState: vented.ventSites[1].gasState,
              filtersAfter: vented.ventNetwork.filters,
              ventValue: vented.ventNetwork.value,
              ventMap: vented.ventNetwork.mapProgress,
              airflowRelief: vented.ventNetwork.airflowRelief,
              stabilityAfter: vented.routeStability.stability,
              drainAfter: game.oxygenDrainRate(vented),
              bankedCredits: afterLift.credits,
              bankedSurveyValue: afterLift.lift.bankedSurveyValue,
              bankedPumpworksValue: afterLift.lift.bankedPumpworksValue,
              bankedVentValue: afterLift.lift.bankedVentValue,
              bankedVentMapProgress: afterLift.lift.bankedVentMapProgress,
              ventLedger: afterLift.ventNetwork.ledger,
              ventValueAfterLift: afterLift.ventNetwork.value,
              restartedVentLedger: restarted.ventNetwork.ledger,
              restartedFilters: restarted.ventNetwork.filters,
              upgradedFilters: game.createInitialState({ purchasedUpgrades: ["filter-stack"] }).ventNetwork.filters,
              restartedRunCount: restarted.run.count,
              lastLog: vented.log[0].message,
            }));
            """
        )

        self.assertEqual(1, result["beforeRelay"]["filters"])
        self.assertEqual("open", result["gateState"])
        self.assertEqual("deployed", result["filterState"])
        self.assertTrue(result["filterDeployed"])
        self.assertEqual("running", result["fanState"])
        self.assertEqual("success", result["relayState"])
        self.assertEqual("cleared", result["gasState"])
        self.assertEqual(0, result["filtersAfter"])
        self.assertEqual(108, result["ventValue"])
        self.assertEqual(2, result["ventMap"])
        self.assertEqual(24, result["airflowRelief"])
        self.assertGreater(result["stabilityAfter"], result["beforeRelay"]["stability"])
        self.assertLess(result["drainAfter"], result["beforeRelay"]["drain"])
        self.assertEqual(282, result["bankedCredits"])
        self.assertEqual(78, result["bankedSurveyValue"])
        self.assertEqual(96, result["bankedPumpworksValue"])
        self.assertEqual(108, result["bankedVentValue"])
        self.assertEqual(2, result["bankedVentMapProgress"])
        self.assertEqual(2, result["ventLedger"])
        self.assertEqual(0, result["ventValueAfterLift"])
        self.assertEqual(2, result["restartedVentLedger"])
        self.assertEqual(1, result["restartedFilters"])
        self.assertEqual(2, result["upgradedFilters"])
        self.assertEqual(2, result["restartedRunCount"])
        self.assertIn("gas pocket success", result["lastLog"])

    def test_partial_and_failed_vent_windows_are_deterministic(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let partial = game.createInitialState({ seed: 149 });
            const cinder = partial.ventSites.find((site) => site.id === "vent-cinder-rib-draft");
            partial.player.position = { x: cinder.position.x, y: 1.6, z: cinder.position.z };
            partial.elapsed = 72;
            partial = game.syncDerivedState(partial);
            const partialBeforeOxygen = partial.oxygen.current;
            partial = game.openDraftGate(partial, "vent-cinder-rib-draft");

            let failed = game.createInitialState({ seed: 149 });
            const overrun = failed.ventSites.find((site) => site.id === "vent-cinder-rib-draft");
            failed.player.position = { x: overrun.position.x, y: 1.6, z: overrun.position.z };
            failed.elapsed = 240;
            failed = game.syncDerivedState(failed);
            failed = game.openDraftGate(failed, "vent-cinder-rib-draft");

            console.log(JSON.stringify({
              partialWindow: partial.ventSites[0].windowState,
              partialGate: partial.ventSites[0].gateState,
              partialMissing: partial.ventSites[0].lastMissing,
              partialGas: partial.ventSites[0].gasPressure,
              partialOxygen: partial.oxygen.current,
              partialBeforeOxygen,
              partialLog: partial.log[0].message,
              failedWindow: failed.ventSites[0].windowState,
              failedGate: failed.ventSites[0].gateState,
              failedRelay: failed.ventSites[0].relayState,
              failedGasState: failed.ventSites[0].gasState,
              failedGas: failed.ventSites[0].gasPressure,
              failedOxygen: failed.oxygen.current,
              failedLog: failed.log[0].message,
            }));
            """
        )

        self.assertEqual("draft", result["partialWindow"])
        self.assertEqual("cracked", result["partialGate"])
        self.assertIn("partial survey chart", result["partialMissing"])
        self.assertGreater(result["partialGas"], 0.48)
        self.assertLess(result["partialOxygen"], result["partialBeforeOxygen"])
        self.assertIn("draft gate cracked", result["partialLog"])
        self.assertEqual("overrun", result["failedWindow"])
        self.assertEqual("jammed", result["failedGate"])
        self.assertEqual("failed", result["failedRelay"])
        self.assertEqual("erupted", result["failedGasState"])
        self.assertGreaterEqual(result["failedGas"], 0.9)
        self.assertLess(result["failedOxygen"], 96)
        self.assertIn("draft gate jammed", result["failedLog"])

    def run_node(self, script: str) -> dict:
        completed = subprocess.run(
            ["node", "-e", textwrap.dedent(script)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(completed.stdout)


if __name__ == "__main__":
    unittest.main()
