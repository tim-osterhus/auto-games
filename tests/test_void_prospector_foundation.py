import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "void-prospector"


class VoidProspectorFoundationTests(unittest.TestCase):
    def test_static_entrypoint_uses_local_renderer_and_hud_regions(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")

        self.assertIn("<title>Void Prospector</title>", html)
        self.assertIn("void-prospector.css", html)
        self.assertIn('src="vendor/three.min.js"', html)
        self.assertIn("void-prospector.js", html)
        self.assertNotIn("https://", html)
        self.assertNotIn("http://", html)
        for region in (
            "void-prospector-scene",
            "prospector-hud",
            "objective-readout",
            "hull-readout",
            "fuel-readout",
            "cargo-readout",
            "credits-readout",
            "pressure-readout",
            "contract-readout",
            "upgrade-readout",
            "target-readout",
            "station-readout",
            "target-panel",
            "control-strip",
            "mine-action",
            "dock-action",
            "upgrade-action",
            "restart-action",
        ):
            self.assertIn(region, html)

        vendor = GAME_DIR / "vendor" / "three.min.js"
        self.assertTrue(vendor.is_file())
        self.assertIn("SPDX-License-Identifier: MIT", vendor.read_text(encoding="utf-8")[:160])

    def test_state_data_exposes_spaceflight_mining_docking_and_pirate_seams(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            const state = game.createInitialState({ seed: 101 });
            console.log(JSON.stringify({
              rendererPath: game.GAME_DATA.renderer.path,
              localOnly: game.GAME_DATA.renderer.localOnly,
              hull: state.ship.hull,
              fuel: state.ship.fuel,
              cargoCapacity: state.cargo.capacity,
              credits: state.credits,
              asteroidCount: state.asteroids.length,
              asteroidSeams: state.asteroids.every((asteroid) => (
                asteroid.id &&
                asteroid.position &&
                asteroid.mineState &&
                asteroid.mineState.status === "ready" &&
                Number.isFinite(asteroid.oreValue) &&
                asteroid.oreRemaining > 0
              )),
              stationDockable: game.dockingStatus(state).dockable,
              stationServices: game.dockingStatus(state).services,
              contractStatus: state.contract.status,
              contractRequiredOre: state.contract.requiredOre,
              contractDeliveredOre: state.contract.deliveredOre,
              tutorialStatus: state.tutorial.status,
              tutorialPhase: state.tutorial.phase,
              tutorialPhases: state.tutorial.phases.map((phase) => phase.id),
              verticalAdjustmentRequired: state.tutorial.verticalAdjustmentRequired,
              disclosure: state.disclosure,
              systemAccess: state.systemAccess,
              selectedPrompt: state.selectedTargetPrompt,
              stationMenu: state.stationMenu,
              miningRange: state.mining.range,
              miningPower: state.ship.miningPower,
              upgradeCount: game.GAME_DATA.upgrades.length,
              verticalUpControls: game.GAME_DATA.controls.ascend,
              targetKind: state.target.kind,
              pirateState: state.pirate.state,
              pirateUnlockState: state.pirate.unlockState,
              cameraMode: state.camera.mode,
              hasCameraVectors: Boolean(state.camera.position && state.camera.target),
              hasOrientation: Boolean(state.ship.orientation && state.ship.orientation.forward),
              hasEngineState: Boolean(state.ship.engineState),
            }));
            """
        )

        self.assertEqual("vendor/three.min.js", result["rendererPath"])
        self.assertTrue(result["localOnly"])
        self.assertEqual(100, result["hull"])
        self.assertEqual(100, result["fuel"])
        self.assertEqual(6, result["cargoCapacity"])
        self.assertEqual(0, result["credits"])
        self.assertGreaterEqual(result["asteroidCount"], 4)
        self.assertTrue(result["asteroidSeams"])
        self.assertFalse(result["stationDockable"])
        self.assertIn("sell cargo", result["stationServices"])
        self.assertEqual("active", result["contractStatus"])
        self.assertEqual(3, result["contractRequiredOre"])
        self.assertEqual(0, result["contractDeliveredOre"])
        self.assertEqual("active", result["tutorialStatus"])
        self.assertEqual("target-alignment", result["tutorialPhase"])
        self.assertEqual(
            [
                "target-alignment",
                "vertical-adjustment",
                "thrust",
                "closing-distance",
                "mining",
                "station-return",
                "docking",
                "cargo-sale",
                "upgrade-preview",
            ],
            result["tutorialPhases"],
        )
        self.assertTrue(result["verticalAdjustmentRequired"])
        self.assertFalse(result["disclosure"]["salvage"])
        self.assertFalse(result["disclosure"]["convoy"])
        self.assertFalse(result["disclosure"]["storm"])
        self.assertFalse(result["disclosure"]["interdiction"])
        self.assertFalse(result["disclosure"]["signalGate"])
        self.assertFalse(result["disclosure"]["upgradeCatalog"])
        self.assertFalse(result["systemAccess"]["pirate"])
        self.assertEqual("closed", result["stationMenu"]["state"])
        self.assertEqual("target-alignment", result["selectedPrompt"]["phase"])
        self.assertIn("Cinder Node", result["selectedPrompt"]["prompt"])
        self.assertGreater(result["miningRange"], 1)
        self.assertGreater(result["miningPower"], 0)
        self.assertGreaterEqual(result["upgradeCount"], 1)
        self.assertIn("KeyQ", result["verticalUpControls"])
        self.assertEqual("asteroid", result["targetKind"])
        self.assertEqual("dormant", result["pirateState"])
        self.assertEqual("locked", result["pirateUnlockState"])
        self.assertEqual("chase", result["cameraMode"])
        self.assertTrue(result["hasCameraVectors"])
        self.assertTrue(result["hasOrientation"])
        self.assertTrue(result["hasEngineState"])

    def test_core_controls_advance_ship_camera_target_and_keep_pirate_locked_during_tutorial(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 22 });
            const start = JSON.parse(JSON.stringify(state));
            state = game.stepSpaceflight(state, { thrust: true, turnRight: true, ascend: true }, 1);
            const afterThrust = JSON.parse(JSON.stringify(state));
            state = game.stepSpaceflight(state, { brake: true }, 1);
            const afterBrake = JSON.parse(JSON.stringify(state));
            const retargeted = game.retarget(afterBrake, 1);
            let pirateLive = afterBrake;
            for (let index = 0; index < 20; index += 1) {
              pirateLive = game.stepSpaceflight(pirateLive, {}, 1);
            }
            console.log(JSON.stringify({
              moved: game.distance(start.ship.position, afterThrust.ship.position),
              movedX: afterThrust.ship.position.x !== start.ship.position.x,
              movedY: afterThrust.ship.position.y !== start.ship.position.y,
              movedZ: afterThrust.ship.position.z !== start.ship.position.z,
              headingChanged: afterThrust.ship.heading !== start.ship.heading,
              pitchChanged: afterThrust.ship.orientation.pitch !== start.ship.orientation.pitch,
              bankVisible: Math.abs(afterThrust.ship.orientation.bank) > 0,
              forwardVector: afterThrust.ship.orientation.forward,
              thrusting: afterThrust.ship.engineState.thrusting,
              verticalAxis: afterThrust.ship.engineState.verticalAxis,
              braking: afterBrake.ship.engineState.braking,
              fuelSpent: start.ship.fuel - afterThrust.ship.fuel,
              speedAfterThrust: game.distance({ x: 0, y: 0, z: 0 }, afterThrust.ship.velocity),
              speedAfterBrake: game.distance({ x: 0, y: 0, z: 0 }, afterBrake.ship.velocity),
              cameraMoved: game.distance(start.camera.position, afterThrust.camera.position),
              targetBefore: afterBrake.target.id,
              targetAfter: retargeted.target.id,
              stationBearing: game.dockingStatus(afterThrust).bearing,
              pirateState: pirateLive.pirate.state,
              pirateEncounter: pirateLive.pirate.encounterState,
            }));
            """
        )

        self.assertGreater(result["moved"], 1)
        self.assertTrue(result["movedX"])
        self.assertTrue(result["movedY"])
        self.assertTrue(result["movedZ"])
        self.assertTrue(result["headingChanged"])
        self.assertTrue(result["pitchChanged"])
        self.assertTrue(result["bankVisible"])
        self.assertIn("x", result["forwardVector"])
        self.assertTrue(result["thrusting"])
        self.assertEqual(1, result["verticalAxis"])
        self.assertTrue(result["braking"])
        self.assertGreater(result["fuelSpent"], 0)
        self.assertGreater(result["speedAfterThrust"], result["speedAfterBrake"])
        self.assertGreater(result["cameraMoved"], 1)
        self.assertNotEqual(result["targetBefore"], result["targetAfter"])
        self.assertIsInstance(result["stationBearing"], int)
        self.assertEqual("dormant", result["pirateState"])
        self.assertEqual("distant", result["pirateEncounter"])

    def test_first_contract_tutorial_completes_from_keyboard_actions_and_unlocks_later_systems(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 33 });
            const initialSalvageTarget = game.setTarget(state, "salvage", state.salvageSites[0].id);

            let guard = 0;
            while (Math.abs(state.target.bearing) > 10 && guard < 20) {
              state = game.stepSpaceflight(state, { turnLeft: true }, 0.1);
              guard += 1;
            }
            state = game.stepSpaceflight(state, { ascend: true }, 1);
            state = game.stepSpaceflight(state, { thrust: true }, 1);

            const node = state.asteroids[0];
            state.ship.position = { x: node.position.x + 2, y: node.position.y, z: node.position.z + 1 };
            state.ship.velocity = { x: 0, y: 0, z: 0 };
            for (let pull = 0; pull < 3; pull += 1) {
              state = game.stepSpaceflight(state, { mine: true }, 1);
            }
            const afterMining = JSON.parse(JSON.stringify(state));
            state.ship.position = { ...state.station.position };
            state.ship.velocity = { x: 0, y: 0, z: 0 };
            state = game.stepSpaceflight(state, { interact: true }, 1);
            const afterDock = JSON.parse(JSON.stringify(state));
            const advancedTarget = game.setTarget(afterDock, "salvage", afterDock.salvageSites[0].id);
            const restart = game.restartTutorial(afterDock);
            let pirateLive = afterDock;
            for (let index = 0; index < 7; index += 1) {
              pirateLive = game.stepSpaceflight(pirateLive, {}, 1);
            }
            console.log(JSON.stringify({
              initialSalvageTargetKind: initialSalvageTarget.target.kind,
              afterMiningPhase: afterMining.tutorial.phase,
              afterMiningPromptKind: afterMining.target.kind,
              oreMined: afterMining.cargo.ore,
              completedPhases: afterDock.tutorial.phases.filter((phase) => phase.complete).map((phase) => phase.id),
              tutorialStatus: afterDock.tutorial.status,
              tutorialPhase: afterDock.tutorial.phase,
              contractStatus: afterDock.contract.status,
              deliveredOre: afterDock.contract.deliveredOre,
              stationMenu: afterDock.stationMenu,
              disclosure: afterDock.disclosure,
              systemAccess: afterDock.systemAccess,
              advancedTargetKind: advancedTarget.target.kind,
              pirateUnlockState: afterDock.pirate.unlockState,
              pirateStateBeforeDelay: afterDock.pirate.state,
              pirateSpawnTick: afterDock.pirate.spawnTick,
              elapsedAfterDock: afterDock.elapsed,
              pirateStateAfterDelay: pirateLive.pirate.state,
              restartStatus: restart.tutorial.status,
              restartPhase: restart.tutorial.phase,
              restartCount: restart.tutorial.restartCount,
              restartAccess: restart.systemAccess,
            }));
            """
        )

        self.assertEqual("asteroid", result["initialSalvageTargetKind"])
        self.assertEqual("station-return", result["afterMiningPhase"])
        self.assertEqual("station", result["afterMiningPromptKind"])
        self.assertEqual(3, result["oreMined"])
        self.assertEqual(
            [
                "target-alignment",
                "vertical-adjustment",
                "thrust",
                "closing-distance",
                "mining",
                "station-return",
                "docking",
                "cargo-sale",
                "upgrade-preview",
            ],
            result["completedPhases"],
        )
        self.assertEqual("complete", result["tutorialStatus"])
        self.assertEqual("upgrade-preview", result["tutorialPhase"])
        self.assertEqual("complete", result["contractStatus"])
        self.assertEqual(3, result["deliveredOre"])
        self.assertTrue(result["stationMenu"]["open"])
        self.assertEqual("tutorial-summary", result["stationMenu"]["state"])
        self.assertTrue(result["stationMenu"]["upgradePreview"]["visible"])
        self.assertTrue(result["disclosure"]["salvage"])
        self.assertTrue(result["systemAccess"]["signalGate"])
        self.assertEqual("salvage", result["advancedTargetKind"])
        self.assertEqual("unlocked", result["pirateUnlockState"])
        self.assertEqual("dormant", result["pirateStateBeforeDelay"])
        self.assertGreater(result["pirateSpawnTick"], result["elapsedAfterDock"])
        self.assertEqual("shadowing", result["pirateStateAfterDelay"])
        self.assertEqual("active", result["restartStatus"])
        self.assertEqual("target-alignment", result["restartPhase"])
        self.assertEqual(1, result["restartCount"])
        self.assertFalse(result["restartAccess"]["salvage"])

    def test_mining_extracts_visible_ore_and_depletes_nodes(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 88 });
            const node = state.asteroids[0];
            state.ship.position = { x: node.position.x + 2, y: node.position.y, z: node.position.z };
            state = game.setTarget(state, "asteroid", node.id);
            for (let index = 0; index < 5; index += 1) {
              state = game.mineTarget(state, 1);
            }
            const mined = state.asteroids[0];
            console.log(JSON.stringify({
              cargoOre: state.cargo.ore,
              cargoValue: state.cargo.value,
              oreRemaining: mined.oreRemaining,
              mineStatus: mined.mineState.status,
              depleted: mined.mineState.depleted,
              miningStatus: state.mining.status,
              targetState: game.targetSummary(state).status,
            }));
            """
        )

        self.assertEqual(5, result["cargoOre"])
        self.assertGreater(result["cargoValue"], 0)
        self.assertEqual(0, result["oreRemaining"])
        self.assertEqual("depleted", result["mineStatus"])
        self.assertTrue(result["depleted"])
        self.assertIn("extracted", result["miningStatus"])
        self.assertIn("depleted", result["targetState"])

    def test_docking_sells_services_and_completes_contract(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 12 });
            state.ship.position = { ...state.station.position };
            state.ship.hull = 52;
            state.ship.fuel = 18;
            state.cargo.ore = 6;
            state.cargo.value = 126;
            state = game.dockAtStation(state);
            const firstDock = JSON.parse(JSON.stringify(state));
            state.cargo.ore = 2;
            state.cargo.value = 50;
            state = game.dockAtStation(state);
            console.log(JSON.stringify({
              firstCredits: firstDock.credits,
              firstDelivered: firstDock.contract.deliveredOre,
              firstCargo: firstDock.cargo.ore,
              repairedHull: firstDock.ship.hull,
              refueled: firstDock.ship.fuel,
              docked: game.dockingStatus(firstDock).docked,
              finalCredits: state.credits,
              finalDelivered: state.contract.deliveredOre,
              contractStatus: state.contract.status,
              runStatus: state.run.status,
            }));
            """
        )

        self.assertEqual(286, result["firstCredits"])
        self.assertEqual(6, result["firstDelivered"])
        self.assertEqual(0, result["firstCargo"])
        self.assertEqual(100, result["repairedHull"])
        self.assertEqual(100, result["refueled"])
        self.assertTrue(result["docked"])
        self.assertEqual(336, result["finalCredits"])
        self.assertEqual(8, result["finalDelivered"])
        self.assertEqual("complete", result["contractStatus"])
        self.assertEqual("complete", result["runStatus"])

    def test_mined_ore_station_return_completes_connected_loop(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 31 });

            function mineNode(index, passes) {
              const node = state.asteroids[index];
              state.ship.position = { x: node.position.x + 2, y: node.position.y, z: node.position.z };
              state = game.setTarget(state, "asteroid", node.id);
              for (let pull = 0; pull < passes; pull += 1) {
                state = game.mineTarget(state, 1);
              }
            }

            mineNode(0, 3);
            state.ship.position = { ...state.station.position };
            state = game.dockAtStation(state);
            const afterFirstReturn = JSON.parse(JSON.stringify(state));

            console.log(JSON.stringify({
              firstDelivered: afterFirstReturn.contract.deliveredOre,
              firstCredits: afterFirstReturn.credits,
              finalCargo: afterFirstReturn.cargo.ore,
              contractStatus: afterFirstReturn.contract.status,
              runStatus: afterFirstReturn.run.status,
              oreMined: afterFirstReturn.stats.oreMined,
              oreSold: afterFirstReturn.stats.oreSold,
            }));
            """
        )

        self.assertEqual(3, result["firstDelivered"])
        self.assertGreater(result["firstCredits"], 0)
        self.assertEqual(0, result["finalCargo"])
        self.assertEqual("complete", result["contractStatus"])
        self.assertEqual("complete", result["runStatus"])
        self.assertEqual(3, result["oreMined"])
        self.assertEqual(3, result["oreSold"])

    def test_upgrades_change_later_runs_and_reset_flow(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 7 });
            state.ship.position = { ...state.station.position };
            state.credits = 100;
            state = game.purchaseUpgrade(state, "refined-beam");
            const upgraded = JSON.parse(JSON.stringify(state));
            const reset = game.resetRun(upgraded);
            console.log(JSON.stringify({
              purchased: upgraded.upgrades.purchased,
              creditsAfterPurchase: upgraded.credits,
              miningPowerAfterPurchase: upgraded.ship.miningPower,
              resetRunCount: reset.run.count,
              resetCredits: reset.credits,
              resetPurchased: reset.upgrades.purchased,
              resetMiningPower: reset.ship.miningPower,
              resetCargo: reset.cargo.ore,
              resetContractStatus: reset.contract.status,
            }));
            """
        )

        self.assertEqual(["refined-beam"], result["purchased"])
        self.assertEqual(10, result["creditsAfterPurchase"])
        self.assertGreater(result["miningPowerAfterPurchase"], 1)
        self.assertEqual(2, result["resetRunCount"])
        self.assertEqual(10, result["resetCredits"])
        self.assertEqual(["refined-beam"], result["resetPurchased"])
        self.assertEqual(result["miningPowerAfterPurchase"], result["resetMiningPower"])
        self.assertEqual(0, result["resetCargo"])
        self.assertEqual("active", result["resetContractStatus"])

    def test_close_pirate_pressure_can_damage_hull_and_steal_cargo(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/void-prospector/void-prospector.js");
            let state = game.createInitialState({ seed: 5 });
            state.elapsed = game.GAME_DATA.pirate.spawnTick;
            state.pirate.state = "shadowing";
            state.pirate.position = { x: state.ship.position.x + 2, y: state.ship.position.y, z: state.ship.position.z + 2 };
            state.cargo.ore = 2;
            state.cargo.value = 60;
            for (let index = 0; index < 4; index += 1) {
              state = game.stepSpaceflight(state, { brake: true }, 1);
            }
            console.log(JSON.stringify({
              pressure: state.pirate.pressure,
              encounter: state.pirate.encounterState,
              hull: state.ship.hull,
              cargoOre: state.cargo.ore,
              oreLost: state.stats.oreLost,
              runStatus: state.run.status,
            }));
            """
        )

        self.assertGreater(result["pressure"], 0)
        self.assertEqual("close", result["encounter"])
        self.assertLess(result["hull"], 100)
        self.assertLess(result["cargoOre"], 2)
        self.assertGreaterEqual(result["oreLost"], 1)
        self.assertIn(result["runStatus"], ("evading", "failed"))

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
