import json
import re
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "dark-factory-dispatch"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"


def source_text(filename: str) -> str:
    return (GAME_DIR / filename).read_text(encoding="utf-8")


class DarkFactoryDispatchOperatorSurfaceTests(unittest.TestCase):
    def test_escalation_surface_hooks_and_operator_controls_are_present(self) -> None:
        html = source_text("index.html")
        css = source_text("dark-factory-dispatch.css")
        js = source_text("dark-factory-dispatch.js")

        for token in (
            'id="escalation-surface"',
            'aria-label="Campaign and Grid Siege status"',
            'id="grid-siege-board"',
            'id="freight-lockdown-board"',
            'id="rail-sabotage-board"',
            'id="queue-policy-select"',
            "Queue policy",
            "Grid Siege",
            "Freight Lockdown",
            "Rail Sabotage",
            "Production floor",
            "Queued jobs",
            "Dispatch board",
            "Improvement rack",
            "Operator log",
        ):
            self.assertIn(token, html)

        for token in (
            "campaignSurfaceState",
            "gridSurfaceState",
            "breachSurfaceState",
            "freightSurfaceState",
            "railSabotageSurfaceState",
            "renderEscalationSurface",
            "renderGridSiege",
            "renderFreightLockdown",
            "renderRailSabotage",
            'data-surface="campaign"',
            'data-surface="emergency"',
            'data-surface="progression"',
            'data-surface="choices"',
            'data-surface="breach"',
            'data-surface="rail-sabotage"',
            'data-grid="sectors"',
            'data-action="overdrive"',
            'data-action="breach-trace"',
            'data-action="breach-defer"',
            'data-action="breach-cleanse"',
            'data-action="breach-quarantine"',
            'data-action="grid-route"',
            'data-action="grid-isolate"',
            'data-action="grid-reserve"',
            'data-action="audit-resolve"',
            'data-action="audit-defer"',
            'data-freight="summary"',
            'data-freight="manifests"',
            'data-action="freight-stage"',
            'data-action="freight-drones"',
            'data-action="freight-defenses"',
            'data-action="freight-reserve"',
            'data-action="freight-reroute"',
            'data-action="freight-hold"',
            'data-action="freight-seal"',
            'data-action="freight-launch"',
            'data-rail-sabotage="summary"',
            'data-rail-sabotage="incidents"',
            'data-action="sabotage-scan"',
            'data-action="sabotage-drones"',
            'data-action="sabotage-defenses"',
            'data-action="sabotage-decoy"',
            'data-action="sabotage-lockdown"',
            'data-action="sabotage-reopen"',
            'data-action="sabotage-reroute"',
            'data-action="sabotage-intercept"',
            'data-action="sabotage-repair"',
            'data-compromised="${compromised ? "true" : "false"}"',
            'data-breach-directive="${entry.breachDirective ? "true" : "false"}"',
            'data-freight-directive="${entry.freightDirective ? "true" : "false"}"',
            'data-sabotage-directive="${entry.sabotageDirective ? "true" : "false"}"',
            'data-breach-quarantine="${quarantineActive ? "true" : "false"}"',
            "setQueuePolicy(currentState",
            "toggleLaneOverdrive(",
            "cleanseCompromisedQueueEntry(currentState",
            "quarantineBreachLane(",
            "traceBreachSource(currentState",
            "deferBreachTrace(currentState",
            "routePowerToSector(currentState",
            "isolateGridSector(currentState",
            "authorizeReserveDraw(currentState",
            "resolveAuditDirective(currentState",
            "deferAuditDirective(currentState",
            "stageFreightCargo(currentState",
            "holdFreightManifest(currentState",
            "assignFreightRouteSecurity(currentState",
            "authorizeFreightLaunchClearance(currentState",
            "rerouteFreightManifest(currentState",
            "sealFreightCarrier(currentState",
            "launchFreightManifest(currentState",
            "scanSabotageManifest(currentState",
            "assignSabotagePatrol(currentState",
            "deploySabotageDecoy(currentState",
            "lockdownSabotageDock(currentState",
            "reopenSabotageDock(currentState",
            "rerouteSabotagedCarrier(currentState",
            "interceptSabotageCell(currentState",
            "repairSabotagedLane(currentState",
        ):
            self.assertIn(token, js)

        for token in (
            ".escalation-strip",
            ".escalation-card",
            ".grid-panel",
            ".grid-siege-board",
            ".freight-panel",
            ".freight-board",
            ".sabotage-panel",
            ".rail-sabotage-board",
            ".rail-sabotage-summary",
            ".rail-incident-list",
            ".rail-incident-card",
            ".rail-incident-meta",
            ".sabotage-rail",
            ".rail-actions",
            ".freight-summary",
            ".freight-manifest-list",
            ".freight-manifest-card",
            ".freight-route",
            ".freight-metrics",
            ".freight-rail",
            ".freight-actions",
            ".grid-sector-list",
            ".grid-sector-card",
            ".grid-directive-card",
            ".grid-actions",
            ".directive-actions",
            ".breach-actions",
            ".breach-readout",
            '.escalation-card[data-surface="breach"][data-alert="active"]',
            '.escalation-card[data-surface="rail-sabotage"][data-alert="incident-open"]',
            '.escalation-card[data-surface="rail-sabotage"][data-alert="sabotaged"]',
            '.lane-card[data-overdrive="true"]',
            '.lane-card[data-breach-quarantine="true"]',
            '.grid-sector-card[data-isolated="true"]',
            '.grid-sector-card[data-breach="contaminated"]',
            '.contract-card[data-emergency="true"]',
            '.contract-card[data-family="breach"]',
            '.queue-item[data-emergency="true"]',
            '.queue-item[data-compromised="true"]',
            '.queue-item[data-freight-directive="true"]',
            '.queue-item[data-sabotage-directive="true"]',
            '.rail-incident-card[data-actionable="true"]',
            '.rail-incident-card[data-lane-damage="sabotaged"]',
            '.job-card[data-family="breach"]',
            '.job-card[data-family="freight"]',
            '.job-card[data-family="sabotage"]',
            '.freight-manifest-card[data-status="available"]',
            '.freight-manifest-card[data-route-alert="true"]',
            "@media (max-width: 720px)",
            "grid-template-areas:",
            "overflow-wrap: anywhere",
        ):
            self.assertIn(token, css)

    def test_campaign_surface_model_exposes_pressure_progression_and_choices(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            const first = game.createInitialState({ seed: 91, faultsEnabled: false });
            const firstSurface = game.campaignSurfaceState(first);

            let second = game.resetFactoryState(first);
            second.faults.enabled = false;
            const pendingSurface = game.campaignSurfaceState(second);
            second = game.stepFactory(second, 6);
            second = game.setQueuePolicy(second, "emergency-first");
            second = game.toggleLaneOverdrive(second, "forge-line", true);
            const activeSurface = game.campaignSurfaceState(second);

            console.log(JSON.stringify({ firstSurface, pendingSurface, activeSurface }));
            """
        )

        first = result["firstSurface"]
        pending = result["pendingSurface"]
        active = result["activeSurface"]

        self.assertEqual("v0.4.0 Freight Lockdown", first["release"])
        self.assertEqual(1, first["shift"])
        self.assertEqual("quiet", first["emergency"]["status"])
        self.assertIn("shift 02", first["emergency"]["detail"])
        self.assertEqual(0, first["progression"]["ledgerCount"])

        self.assertEqual(2, pending["shift"])
        self.assertEqual("pending", pending["emergency"]["status"])
        self.assertIn("arms t6", pending["emergency"]["detail"])
        self.assertEqual(1, pending["progression"]["ledgerCount"])
        self.assertIn("shift 01", pending["progression"]["latest"])

        self.assertEqual("Emergency First", active["queuePolicy"]["name"])
        self.assertEqual("active", active["emergency"]["status"])
        self.assertEqual(1, active["choices"]["queuePolicyChanges"])
        self.assertEqual(1, active["choices"]["laneOverdrives"])
        self.assertEqual(1, active["choices"]["activeOverdrives"])
        self.assertEqual("active", active["breach"]["status"])
        self.assertIn(active["breach"]["source"]["name"], {"Spoofed Dispatch Uplink", "Audit Ghost Carrier"})

    def test_signal_breach_surface_model_exposes_operator_visible_decisions(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 93, faultsEnabled: false });
            state = game.stepFactory(state, 3);
            const compromisedId = state.queue.find((entry) => entry.compromised).id;
            const activeSurface = game.breachSurfaceState(state);

            state = game.cleanseCompromisedQueueEntry(state, compromisedId);
            state = game.authorizeReserveDraw(state, "assembly-bus");
            state = game.quarantineBreachLane(state, "assembler-bay", true);
            const containedSurface = game.breachSurfaceState(state);

            console.log(JSON.stringify({ activeSurface, containedSurface }));
            """
        )

        active = result["activeSurface"]
        contained = result["containedSurface"]

        self.assertEqual("active", active["status"])
        self.assertEqual("active", active["trace"]["status"])
        self.assertEqual(1, len([entry for entry in active["queue"] if entry["compromised"]]))
        self.assertEqual(1, len([entry for entry in active["queue"] if entry["breachDirective"]]))
        self.assertEqual(["assembly-bus"], [
            sector["id"]
            for sector in active["sectors"]
            if sector["breach"]["status"] == "contaminated"
        ])

        self.assertEqual(1, contained["choices"]["cleanses"])
        self.assertEqual(["assembler-bay"], contained["containment"]["quarantinedLanes"])
        self.assertEqual(1, contained["containment"]["shieldedSectors"])
        self.assertEqual("quarantined", [
            sector["breach"]["status"]
            for sector in contained["sectors"]
            if sector["id"] == "assembly-bus"
        ][0])

    def test_grid_siege_surface_model_exposes_visible_decision_state(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ run: 2, seed: 101, faultsEnabled: false });
            state = game.stepFactory(state, 4);
            const activeSurface = game.gridSurfaceState(state);

            state = game.routePowerToSector(state, "forge-bus", "priority");
            state = game.authorizeReserveDraw(state, "forge-bus");
            state = game.isolateGridSector(state, "assembly-bus", true);
            state = game.deferAuditDirective(state);
            const deferredSurface = game.gridSurfaceState(state);
            state = game.resolveAuditDirective(state);
            const resolvedSurface = game.gridSurfaceState(state);

            console.log(JSON.stringify({ activeSurface, deferredSurface, resolvedSurface }));
            """
        )

        active = result["activeSurface"]
        deferred = result["deferredSurface"]
        resolved = result["resolvedSurface"]

        self.assertEqual("active", active["audit"]["status"])
        self.assertEqual("Reserve Ledger Audit", active["audit"]["name"])
        self.assertEqual({"circuits": 1, "power": 1}, active["audit"]["repairCost"])
        self.assertEqual({"stability": 3}, active["audit"]["deferCost"])
        self.assertTrue(active["audit"]["queued"])
        self.assertEqual(3, len(active["sectors"]))
        self.assertIn("assembly-bus", active["sectors"][0]["connectedTo"] + active["sectors"][1]["connectedTo"])
        self.assertIn("laneName", active["sectors"][0])
        self.assertIn("powered", active["sectors"][0])

        self.assertEqual("priority", deferred["sectors"][0]["route"])
        self.assertEqual(2, deferred["reserve"]["available"])
        self.assertEqual(3, deferred["reserve"]["drawn"])
        self.assertTrue(deferred["sectors"][1]["isolated"])
        self.assertFalse(deferred["sectors"][1]["powered"])
        self.assertEqual(1, deferred["audit"]["deferrals"])
        self.assertGreater(deferred["audit"]["dueTick"], active["audit"]["dueTick"])
        self.assertEqual(1, deferred["choices"]["powerRoutes"])
        self.assertEqual(1, deferred["choices"]["reserveDraws"])
        self.assertEqual(1, deferred["choices"]["sectorIsolations"])

        self.assertEqual("complete", resolved["audit"]["status"])
        self.assertEqual(1, resolved["audit"]["completed"])
        self.assertEqual(1, resolved["choices"]["auditRepairs"])

    def test_rail_sabotage_surface_model_exposes_actionable_operator_state(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 331, faultsEnabled: false });
            state = game.stepFactory(state, 2);
            state.resources.circuits = 5;
            state.resources.power = 12;
            state.resources.drones = 3;
            state.resources.defenses = 3;
            state.resources.scrap = 30;
            state.resources.stability = 20;

            const beforeSurface = game.railSabotageSurfaceState(state);
            const beforeIncident = beforeSurface.incidents.find((incident) => incident.id === "ashline-rail-spoof");

            state = game.scanSabotageManifest(state, "ashline-rail-spoof");
            state = game.assignSabotagePatrol(state, "ashline-rail-spoof", "drones");
            state = game.deploySabotageDecoy(state, "ashline-rail-spoof", "forge-bus");
            state = game.lockdownSabotageDock(state, "ashline-rail-spoof");
            const lockedSurface = game.railSabotageSurfaceState(state);
            const lockedIncident = lockedSurface.incidents.find((incident) => incident.id === "ashline-rail-spoof");
            const lockedLane = state.lanes.find((lane) => lane.id === "forge-line");

            state = game.reopenSabotageDock(state, "ashline-rail-spoof");
            state = game.rerouteSabotagedCarrier(state, "ashline-rail-spoof", "forge-bus");
            const reroutedIncident = game.railSabotageSurfaceState(state).incidents
              .find((incident) => incident.id === "ashline-rail-spoof");
            state = game.interceptSabotageCell(state, "ashline-rail-spoof");
            const finalSurface = game.railSabotageSurfaceState(state);
            const finalIncident = finalSurface.incidents.find((incident) => incident.id === "ashline-rail-spoof");
            const finalManifest = game.freightSurfaceState(state).manifests
              .find((manifest) => manifest.id === "ashline-spare-crates");
            const choices = game.campaignSurfaceState(state).choices;

            console.log(JSON.stringify({
              beforeSurface,
              beforeIncident,
              lockedIncident,
              lockedLane,
              reroutedIncident,
              finalSurface,
              finalIncident,
              finalManifest,
              choices,
              latestLog: state.log[0],
            }));
            """
        )

        before = result["beforeIncident"]
        locked = result["lockedIncident"]
        rerouted = result["reroutedIncident"]
        final = result["finalIncident"]
        manifest = result["finalManifest"]

        self.assertEqual("v0.5.0 Rail Sabotage", result["beforeSurface"]["release"])
        self.assertEqual("available", before["status"])
        self.assertEqual("Dock Alpha", before["dockName"])
        self.assertEqual("Forge Line", before["laneName"])
        self.assertEqual("queued", before["scan"]["status"])
        self.assertEqual("drones", before["patrol"]["required"])
        self.assertIn("manifestRoute", before)
        self.assertIn("manifestSabotage", before)
        self.assertEqual("suspect", before["manifestSabotage"]["scanStatus"])
        self.assertEqual(100, before["manifestIntegrity"])

        self.assertTrue(locked["dock"]["locked"])
        self.assertFalse(locked["dockReady"])
        self.assertEqual("locked", result["lockedLane"]["status"])
        self.assertEqual("rail-sabotage-lockdown", result["lockedLane"]["gridLock"]["reason"])

        self.assertTrue(rerouted["carrier"]["rerouted"])
        self.assertTrue(rerouted["manifestRoute"]["rerouted"])
        self.assertLess(manifest["integrity"], before["manifestIntegrity"])

        self.assertEqual("contained", final["status"])
        self.assertEqual("contained", final["outcome"])
        self.assertGreaterEqual(final["containment"]["score"], final["containment"]["requiredScore"])
        self.assertEqual("complete", final["scan"]["status"])
        self.assertEqual(1, final["patrol"]["drones"])
        self.assertTrue(final["decoy"]["deployed"])
        self.assertTrue(final["containment"]["intercepted"])
        self.assertEqual(1, result["finalSurface"]["outcomes"]["contained"])

        self.assertEqual("complete", manifest["sabotage"]["scanStatus"])
        self.assertEqual(1, manifest["sabotage"]["patrolDrones"])
        self.assertTrue(manifest["sabotage"]["decoy"])
        self.assertFalse(manifest["sabotage"]["dockLocked"])
        self.assertTrue(manifest["route"]["rerouted"])

        self.assertEqual(1, result["choices"]["sabotageScans"])
        self.assertEqual(1, result["choices"]["sabotagePatrolDrones"])
        self.assertEqual(1, result["choices"]["sabotageDecoys"])
        self.assertEqual(1, result["choices"]["sabotageDockLockdowns"])
        self.assertEqual(1, result["choices"]["sabotageDockReopens"])
        self.assertEqual(1, result["choices"]["sabotageCarrierReroutes"])
        self.assertEqual(1, result["choices"]["sabotageInterceptions"])
        self.assertIn("interception resolved", result["latestLog"]["message"])

    def test_grid_siege_layout_contract_uses_named_areas_and_narrow_stacking(self) -> None:
        css = source_text("dark-factory-dispatch.css")

        for token in (
            '"lanes grid grid"',
            '"lanes freight freight"',
            '"lanes sabotage sabotage"',
            '"controls controls log"',
            '"lanes lanes"',
            '"grid grid"',
            '"freight freight"',
            '"sabotage sabotage"',
            '"controls log"',
            '"lanes"',
            '"grid"',
            '"freight"',
            '"sabotage"',
            ".grid-summary,\n  .grid-sector-meta",
            ".grid-actions,\n  .directive-actions",
            ".breach-actions,\n  .contract-reward",
        ):
            self.assertIn(token, css)

        self.assertNotIn("overflow-x: scroll", css)

    def test_escalation_surface_does_not_add_stale_raster_asset_references(self) -> None:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        manifest_paths = {
            asset["path"].removeprefix("games/dark-factory-dispatch/")
            for asset in manifest["assets"]
        }
        combined = "\n".join(
            source_text(filename)
            for filename in (
                "index.html",
                "dark-factory-dispatch.css",
                "dark-factory-dispatch.js",
            )
        )

        for reference in re.findall(r'assets/[^"\'\)\s]+\.png', combined):
            self.assertIn(reference, manifest_paths, reference)

        self.assertNotIn("job-stabilize-grid.png", combined)
        self.assertNotIn('"stabilize-grid": "assets/', combined)
        self.assertNotIn("assets/freight-", combined)
        self.assertNotIn("assets/dock-", combined)
        self.assertNotIn("assets/carrier-", combined)
        self.assertNotIn("assets/sabotage-", combined)
        self.assertNotIn("assets/rail-", combined)

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
