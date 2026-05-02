import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class IronLanternDescentSurvivalLoopTests(unittest.TestCase):
    def test_first_expedition_context_loop_mines_banks_and_summarizes(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 301 });
            const start = JSON.parse(JSON.stringify(state));
            for (let pass = 0; pass < 12; pass += 1) {
              state = game.stepRun(state, { forward: true }, 0.25);
            }
            const beforeLantern = JSON.parse(JSON.stringify(state));
            state = game.performContextAction(state);
            const afterLantern = JSON.parse(JSON.stringify(state));
            const target = state.sampleNodes.find((node) => node.id === "sample-copper-iris");
            state.player.position = { x: target.position.x, y: 1.6, z: target.position.z };
            state = game.syncDerivedState(state);
            const minePrompt = JSON.parse(JSON.stringify(state.contextAction));
            state = game.performContextAction(state, { deltaSeconds: 1 });
            const afterFirstHold = JSON.parse(JSON.stringify(state));
            state = game.performContextAction(state, { deltaSeconds: 1 });
            const afterMine = JSON.parse(JSON.stringify(state));
            state.player.position = { x: state.lift.position.x, y: 1.6, z: state.lift.position.z };
            state = game.syncDerivedState(state);
            const bankPrompt = JSON.parse(JSON.stringify(state.contextAction));
            state = game.performContextAction(state);
            const afterBank = JSON.parse(JSON.stringify(state));

            console.log(JSON.stringify({
              startPhase: start.firstExpedition.phase,
              movedPhase: beforeLantern.firstExpedition.phase,
              oxygenBefore: start.oxygen.current,
              oxygenAfterMove: beforeLantern.oxygen.current,
              routeBefore: start.route.returnConfidence,
              routeAfterMove: beforeLantern.route.returnConfidence,
              routeAction: beforeLantern.contextAction.action,
              routeAfterLantern: afterLantern.route.returnConfidence,
              lanternsAfter: afterLantern.lanterns.anchors.length,
              minePhase: minePrompt.action,
              mineHold: minePrompt.hold,
              progressAfterFirstHold: afterFirstHold.sampleNodes.find((node) => node.id === "sample-copper-iris").mineState.progress,
              cargoAfterMine: afterMine.cargo.samples,
              minedPhase: afterMine.firstExpedition.phase,
              bankAction: bankPrompt.action,
              bankAvailable: afterMine.banking.available,
              creditsAfterBank: afterBank.credits,
              cargoAfterBank: afterBank.cargo.samples,
              runAfterBank: afterBank.run.status,
              bankedSamples: afterBank.lift.bankedSamples,
              summaryPhase: afterBank.firstExpedition.phase,
              summary: afterBank.firstExpedition.summary,
              bankingSummary: afterBank.banking.summary,
              objectiveAfterBank: afterBank.run.objective,
            }));
            """
        )

        self.assertEqual("lift-briefing", result["startPhase"])
        self.assertEqual("place-first-lantern", result["movedPhase"])
        self.assertLess(result["oxygenAfterMove"], result["oxygenBefore"])
        self.assertLess(result["routeAfterMove"], result["routeBefore"])
        self.assertEqual("place-lantern", result["routeAction"])
        self.assertGreater(result["routeAfterLantern"], result["routeAfterMove"])
        self.assertEqual(1, result["lanternsAfter"])
        self.assertEqual("mine-sample", result["minePhase"])
        self.assertTrue(result["mineHold"])
        self.assertGreater(result["progressAfterFirstHold"], 0)
        self.assertEqual(1, result["cargoAfterMine"])
        self.assertEqual("return-to-lift", result["minedPhase"])
        self.assertEqual("bank-samples", result["bankAction"])
        self.assertFalse(result["bankAvailable"])
        self.assertEqual(32, result["creditsAfterBank"])
        self.assertEqual(0, result["cargoAfterBank"])
        self.assertEqual("extracted", result["runAfterBank"])
        self.assertEqual(1, result["bankedSamples"])
        self.assertEqual("summary-upgrade-preview", result["summaryPhase"])
        self.assertEqual(1, result["summary"]["bankedSamples"])
        self.assertEqual(32, result["bankingSummary"]["lastTransfer"]["credits"])
        self.assertIn("Preview", result["objectiveAfterBank"])

    def test_context_action_routes_core_fallback_and_advanced_system_steps(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            const fresh = game.createInitialState({ seed: 307 });

            let empty = game.createInitialState({ seed: 307, runCount: 6 });
            empty.sampleNodes = [];
            empty.lanterns.charges = 0;
            empty.player.position = { x: 0, y: 1.6, z: -42 };
            empty = game.syncDerivedState(empty);

            let pump = game.createInitialState({ seed: 307, runCount: 3 });
            const pumpSite = pump.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            pump.player.position = { x: pumpSite.position.x, y: 1.6, z: pumpSite.position.z };
            pump.elapsed = 50;
            pump = game.syncDerivedState(pump);
            const pumpAction = game.resolveContextAction(pump);
            pump.pumpworksSites.find((site) => site.id === "pump-cinder-sump").pumpPrimed = true;
            pump = game.syncDerivedState(pump);
            const valveAction = game.resolveContextAction(pump);

            let vent = game.createInitialState({ seed: 307, runCount: 4 });
            const ventSite = vent.ventSites.find((site) => site.id === "vent-cinder-rib-draft");
            vent.player.position = { x: ventSite.position.x, y: 1.6, z: ventSite.position.z };
            vent.elapsed = 72;
            vent = game.syncDerivedState(vent);
            const ventAction = game.resolveContextAction(vent);

            let relay = game.createInitialState({ seed: 307, runCount: 5 });
            const relaySite = relay.relaySites.find((site) => site.id === "relay-cinder-echo-pylon");
            relay.player.position = { x: relaySite.position.x, y: 1.6, z: relaySite.position.z };
            relay.elapsed = 118;
            relay = game.syncDerivedState(relay);
            const relayAction = game.resolveContextAction(relay);
            const relayMut = relay.relaySites.find((site) => site.id === "relay-cinder-echo-pylon");
            relayMut.pylonState = "repaired";
            relayMut.cableState = "spooled";
            relayMut.triangulationState = "success";
            relay = game.syncDerivedState(relay);
            const cacheAction = game.resolveContextAction(relay);
            relay.relaySites.find((site) => site.id === "relay-cinder-echo-pylon").cacheState.status = "claimed";
            relay = game.syncDerivedState(relay);
            const beaconAction = game.resolveContextAction(relay);

            console.log(JSON.stringify({
              freshAction: fresh.contextAction.action,
              freshKind: fresh.contextAction.kind,
              emptyAction: empty.contextAction.action,
              emptyLabel: empty.contextAction.label,
              pumpAction: pumpAction.action,
              pumpTarget: pumpAction.targetId,
              valveAction: valveAction.action,
              ventAction: ventAction.action,
              relayAction: relayAction.action,
              cacheAction: cacheAction.action,
              cacheKind: cacheAction.kind,
              beaconAction: beaconAction.action,
              beaconKind: beaconAction.kind,
            }));
            """
        )

        self.assertEqual("move", result["freshAction"])
        self.assertEqual("movement", result["freshKind"])
        self.assertEqual("move", result["emptyAction"])
        self.assertEqual("Keep Moving", result["emptyLabel"])
        self.assertEqual("prime-pump", result["pumpAction"])
        self.assertEqual("pump-cinder-sump", result["pumpTarget"])
        self.assertEqual("turn-valve", result["valveAction"])
        self.assertEqual("open-draft-gate", result["ventAction"])
        self.assertEqual("repair-relay", result["relayAction"])
        self.assertEqual("claim-rescue-cache", result["cacheAction"])
        self.assertEqual("rescue-cache", result["cacheKind"])
        self.assertEqual("fire-lift-beacon", result["beaconAction"])
        self.assertEqual("lift-beacon", result["beaconKind"])

    def test_lantern_chain_improves_return_confidence_and_pressure(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let unmarked = game.createInitialState({ seed: 31 });
            unmarked.player.position = { x: 0, y: 1.6, z: -38 };
            unmarked = game.syncDerivedState(unmarked);
            const unmarkedDrain = game.oxygenDrainRate(unmarked);

            let routed = game.createInitialState({ seed: 31 });
            routed.player.position = { x: 0, y: 1.6, z: -10 };
            routed = game.placeLantern(game.syncDerivedState(routed));
            routed.player.position = { x: 0, y: 1.6, z: -26 };
            routed = game.placeLantern(game.syncDerivedState(routed));
            routed.player.position = { x: 0, y: 1.6, z: -38 };
            routed = game.syncDerivedState(routed);
            const routedDrain = game.oxygenDrainRate(routed);
            routed = game.pulseScanner(routed);

            console.log(JSON.stringify({
              unmarkedConfidence: unmarked.route.returnConfidence,
              routedConfidence: routed.route.returnConfidence,
              unmarkedDrain,
              routedDrain,
              routeStatus: routed.route.status,
              linkedLegs: routed.route.linkedLegs,
              stretchedLegs: routed.route.stretchedLegs,
              anchorCount: routed.route.anchorCount,
              scannerTargetKind: routed.scanner.targetKind,
              scannerTargetBearing: routed.scanner.targetBearing,
              scannerRouteBearing: routed.scanner.routeBearing,
              scannerLastPulse: routed.scanner.lastPulse,
              scannerStatus: routed.scanner.status,
            }));
            """
        )

        self.assertGreater(result["routedConfidence"], result["unmarkedConfidence"])
        self.assertGreater(result["unmarkedDrain"], result["routedDrain"])
        self.assertIn(result["routeStatus"], ("route visible", "anchor safe"))
        self.assertEqual(2, result["linkedLegs"])
        self.assertEqual(0, result["stretchedLegs"])
        self.assertEqual(2, result["anchorCount"])
        self.assertEqual("sample", result["scannerTargetKind"])
        self.assertIsInstance(result["scannerTargetBearing"], int)
        self.assertIsInstance(result["scannerRouteBearing"], int)
        self.assertEqual(result["routedConfidence"], result["scannerLastPulse"]["routeConfidence"])
        self.assertIn("pulse", result["scannerStatus"])

    def test_hazard_pressure_mining_lift_scoring_and_upgrade_carryover(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            const safe = game.createInitialState({ seed: 37 });
            let hazard = game.createInitialState({ seed: 37 });
            hazard.player.position = { x: 12, y: 1.6, z: -31 };
            hazard = game.syncDerivedState(hazard);

            let state = game.createInitialState({ seed: 37 });
            const node = state.sampleNodes[3];
            state.player.position = { x: node.position.x, y: 1.6, z: node.position.z };
            state = game.syncDerivedState(state);
            for (let pass = 0; pass < 6; pass += 1) {
              state = game.mineNearestSample(state, 1);
            }
            const afterMine = JSON.parse(JSON.stringify(state));
            state.player.position = { x: state.lift.position.x, y: 1.6, z: state.lift.position.z };
            state = game.returnToLift(game.syncDerivedState(state));
            const afterLift = JSON.parse(JSON.stringify(state));
            state = game.purchaseUpgrade(state, "tank-weave");
            const afterUpgrade = JSON.parse(JSON.stringify(state));
            const nextRun = game.resetRun(state);

            console.log(JSON.stringify({
              safeDrain: game.oxygenDrainRate(safe),
              hazardDrain: game.oxygenDrainRate(hazard),
              hazardNames: hazard.hazardZones.filter((zone) => zone.active).map((zone) => zone.name),
              samplesAfterMine: afterMine.cargo.samples,
              valueAfterMine: afterMine.cargo.value,
              nodeStatus: afterMine.sampleNodes[3].mineState.status,
              nodeRemaining: afterMine.sampleNodes[3].remaining,
              creditsAfterLift: afterLift.credits,
              cargoAfterLift: afterLift.cargo.samples,
              runAfterLift: afterLift.run.status,
              liftBanked: afterLift.lift.bankedSamples,
              purchased: afterUpgrade.upgrades.purchased,
              creditsAfterUpgrade: afterUpgrade.credits,
              nextOxygenMax: nextRun.oxygen.max,
              nextRunStatus: nextRun.run.status,
              nextRunCount: nextRun.run.count,
            }));
            """
        )

        self.assertGreater(result["hazardDrain"], result["safeDrain"])
        self.assertIn("Gas Vent", result["hazardNames"])
        self.assertEqual(2, result["samplesAfterMine"])
        self.assertGreaterEqual(result["valueAfterMine"], 100)
        self.assertEqual("depleted", result["nodeStatus"])
        self.assertEqual(0, result["nodeRemaining"])
        self.assertEqual(result["valueAfterMine"], result["creditsAfterLift"])
        self.assertEqual(0, result["cargoAfterLift"])
        self.assertEqual("extracted", result["runAfterLift"])
        self.assertEqual(2, result["liftBanked"])
        self.assertIn("tank-weave", result["purchased"])
        self.assertLess(result["creditsAfterUpgrade"], result["creditsAfterLift"])
        self.assertEqual(120, result["nextOxygenMax"])
        self.assertEqual("active", result["nextRunStatus"])
        self.assertEqual(2, result["nextRunCount"])

    def test_lift_return_requires_range_and_preserves_carried_samples(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 43 });
            state.cargo.samples = 1;
            state.cargo.value = 32;
            state.player.position = { x: 0, y: 1.6, z: -30 };
            state = game.returnToLift(game.syncDerivedState(state));
            console.log(JSON.stringify({
              liftStatus: state.lift.status,
              credits: state.credits,
              cargoSamples: state.cargo.samples,
              cargoValue: state.cargo.value,
              runStatus: state.run.status,
            }));
            """
        )

        self.assertEqual("too far", result["liftStatus"])
        self.assertEqual(0, result["credits"])
        self.assertEqual(1, result["cargoSamples"])
        self.assertEqual(32, result["cargoValue"])
        self.assertEqual("active", result["runStatus"])

    def test_failure_restart_clears_run_state_and_keeps_upgrades(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 47, credits: 70 });
            state = game.purchaseUpgrade(state, "tank-weave");
            state.player.position = { x: 12, y: 1.6, z: -31 };
            state.oxygen.current = 0.18;
            state = game.stepRun(game.syncDerivedState(state), { forward: true }, 1);
            const failed = JSON.parse(JSON.stringify(state));
            const restarted = game.resetRun(state);
            console.log(JSON.stringify({
              failedStatus: failed.run.status,
              failureReason: failed.run.failureReason,
              restartedStatus: restarted.run.status,
              restartedFailureReason: restarted.run.failureReason,
              restartedOxygen: restarted.oxygen.current,
              restartedOxygenMax: restarted.oxygen.max,
              restartedLanterns: restarted.lanterns.charges,
              restartedCredits: restarted.credits,
              restartedPumpworksLedger: restarted.pumpworks.ledger,
              restartedSiphons: restarted.pumpworks.siphons,
              restartedVentLedger: restarted.ventNetwork.ledger,
              restartedFilters: restarted.ventNetwork.filters,
              restartedEchoLedger: restarted.echoRelayNetwork.ledger,
              restartedEchoCharges: restarted.echoRelayNetwork.echoCharges,
              purchased: restarted.upgrades.purchased,
              runCount: restarted.run.count,
            }));
            """
        )

        self.assertEqual("failed", result["failedStatus"])
        self.assertEqual("oxygen depleted", result["failureReason"])
        self.assertEqual("active", result["restartedStatus"])
        self.assertIsNone(result["restartedFailureReason"])
        self.assertEqual(120, result["restartedOxygen"])
        self.assertEqual(120, result["restartedOxygenMax"])
        self.assertEqual(3, result["restartedLanterns"])
        self.assertEqual(10, result["restartedCredits"])
        self.assertEqual(0, result["restartedPumpworksLedger"])
        self.assertEqual(1, result["restartedSiphons"])
        self.assertEqual(0, result["restartedVentLedger"])
        self.assertEqual(1, result["restartedFilters"])
        self.assertEqual(0, result["restartedEchoLedger"])
        self.assertEqual(2, result["restartedEchoCharges"])
        self.assertEqual(["tank-weave"], result["purchased"])
        self.assertEqual(2, result["runCount"])

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
