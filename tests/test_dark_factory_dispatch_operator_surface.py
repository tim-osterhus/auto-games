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
    def test_factory_floor_shell_and_contextual_controls_are_present(self) -> None:
        html = source_text("index.html")
        css = source_text("dark-factory-dispatch.css")
        js = source_text("dark-factory-dispatch.js")

        for token in (
            'id="objective-card"',
            'id="top-stats"',
            'class="operator-layout"',
            'class="left-rail"',
            'class="right-rail"',
            'id="lane-board"',
            'Forge Line / Assembler Bay / Clean Room',
            'id="selected-detail"',
            'id="context-actions"',
            'id="operator-log"',
            'id="advanced-drawer"',
            "Advanced systems",
            'id="escalation-surface"',
            'aria-label="Campaign and Grid Siege status"',
            'id="grid-siege-board"',
            'id="freight-lockdown-board"',
            'id="rail-sabotage-board"',
            'id="crisis-arbitration-board"',
            'id="queue-policy-select"',
            "Queue policy",
            "Grid Siege",
            "Freight Lockdown",
            "Rail Sabotage",
            "Crisis Arbitration",
            "Incoming jobs",
            "Current objective",
            "Improvement rack",
            "Last signals",
        ):
            self.assertIn(token, html)

        for token in (
            "campaignSurfaceState",
            "gridSurfaceState",
            "breachSurfaceState",
            "freightSurfaceState",
            "railSabotageSurfaceState",
            "crisisArbitrationSurfaceState",
            "renderEscalationSurface",
            "renderGridSiege",
            "renderFreightLockdown",
            "renderRailSabotage",
            "renderCrisisArbitration",
            "renderObjective",
            "renderTopStats",
            "renderSelectedDetail",
            "renderContextActions",
            "factoryFeedbackState",
            "laneFeedbackState",
            "resourceFeedbackState",
            "jobFeedbackState",
            "upgradeFeedbackState",
            "shiftSummaryFeedbackState",
            "pauseLane",
            'data-surface="campaign"',
            'data-surface="emergency"',
            'data-surface="progression"',
            'data-surface="choices"',
            'data-surface="breach"',
            'data-surface="rail-sabotage"',
            'data-surface="crisis-arbitration"',
            'data-grid="sectors"',
            '"overdrive"',
            'data-action="${action.id}"',
            '"select-incoming"',
            'data-selection="lane"',
            'data-selection="job"',
            'data-action="breach-trace"',
            'data-action="breach-defer"',
            'data-action="breach-cleanse"',
            '"breach-quarantine"',
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
            'data-visual-hook="sabotage-incident"',
            'data-action="sabotage-scan"',
            'data-action="sabotage-drones"',
            'data-action="sabotage-defenses"',
            'data-action="sabotage-decoy"',
            'data-action="sabotage-lockdown"',
            'data-action="sabotage-reopen"',
            'data-action="sabotage-reroute"',
            'data-action="sabotage-intercept"',
            'data-action="sabotage-repair"',
            'data-crisis="summary"',
            'data-crisis="docket"',
            'data-visual-hook="crisis-summary"',
            'data-action="crisis-evidence"',
            'data-action="crisis-override"',
            'data-action="crisis-defer"',
            'data-action="crisis-protect"',
            'data-action="crisis-rule"',
            'data-compromised="${compromised ? "true" : "false"}"',
            'data-breach-directive="${entry.breachDirective ? "true" : "false"}"',
            'data-freight-directive="${entry.freightDirective ? "true" : "false"}"',
            'data-sabotage-directive="${entry.sabotageDirective ? "true" : "false"}"',
            'data-breach-quarantine="${quarantineActive ? "true" : "false"}"',
            'data-protected="${caseState.protection.laneGuarded ? "true" : "false"}"',
            "setQueuePolicy(currentState",
            "toggleLaneOverdrive(",
            "performContextAction(currentState",
            "selectJobCard(currentState",
            "selectLane(currentState",
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
            "assignCrisisEvidence(currentState",
            "buyCrisisEmergencyOverride(currentState",
            "deferCrisisCase(currentState",
            "protectCrisisLane(currentState",
            "ruleCrisisCase(currentState",
        ):
            self.assertIn(token, js)

        for token in (
            ".operator-layout",
            '"left floor right"',
            '"actions actions log"',
            ".factory-floor-panel",
            "min-height: 55vh",
            ".lane-board",
            "grid-template-columns: repeat(3, minmax(0, 1fr))",
            ".lane-machine",
            ".state-marker",
            ".context-actions",
            ".selected-detail",
            ".objective-card",
            ".top-stats",
            ".advanced-drawer",
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
            ".crisis-panel",
            ".crisis-board",
            ".crisis-summary",
            ".crisis-case-list",
            ".crisis-case-card",
            ".crisis-case-meta",
            ".crisis-evidence-seals",
            ".crisis-evidence-actions",
            ".crisis-priority-actions",
            ".crisis-actions",
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
            '.lane-card[data-status="running"] .belt',
            '.lane-card[data-feedback="production"] .job-token',
            '.lane-card[data-feedback="overdrive"] .job-token',
            '.lane-card[data-feedback="jam"] .belt',
            '.lane-card[data-feedback="recovery"] .lane-machine',
            '.lane-card[data-status="blocked"]',
            '.lane-card[data-status="recovering"]',
            '.lane-card[data-overdrive="true"]',
            '.output-token[data-active="true"]',
            '.resource-pulse[data-active="true"]',
            '.readout[data-feedback="produced"]',
            '.readout[data-signal="shortage"]',
            '.queue-item[data-shortage="true"]',
            '.job-card[data-shortage="true"]',
            '.incident-marker[data-active="true"]',
            '.upgrade-card[data-feedback="available"] .upgrade-icon',
            '.shift-summary-card[data-feedback="summary-open"]',
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
            '.crisis-case-card[data-actionable="true"]',
            '.crisis-case-card[data-protected="true"]',
            '.crisis-evidence-seals span[data-assigned="true"]',
            "@media (prefers-reduced-motion: reduce)",
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

    def test_contextual_actions_drive_click_first_job_lane_loop(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 17, faultsEnabled: false, replayTutorial: true });
            const initialActions = game.contextualActionsForState(state);

            state = game.selectJobCard(state, state.queue[0].id);
            const jobOnlyActions = game.contextualActionsForState(state);

            state = game.selectLane(state, "forge-line");
            const readyActions = game.contextualActionsForState(state);
            state = game.performContextAction(state, "assign");
            const assignedLane = state.lanes.find((lane) => lane.id === "forge-line");
            const assignedActions = game.contextualActionsForState(state);

            state = game.performContextAction(state, "start");
            const runningActions = game.contextualActionsForState(state);
            state = game.performContextAction(state, "pause");
            const pausedLane = state.lanes.find((lane) => lane.id === "forge-line");

            console.log(JSON.stringify({
              initialActions,
              jobOnlyActions,
              readyActions,
              assignedStatus: assignedLane.status,
              assignedActions,
              runningActions,
              pausedStatus: pausedLane.status,
              selectedLaneId: state.selection.selectedLaneId,
            }));
            """
        )

        self.assertEqual([], result["initialActions"])
        self.assertEqual(["assign"], [action["id"] for action in result["jobOnlyActions"]])
        self.assertFalse(result["jobOnlyActions"][0]["available"])
        self.assertEqual(["assign"], [action["id"] for action in result["readyActions"]])
        self.assertTrue(result["readyActions"][0]["available"])
        self.assertEqual("assigned", result["assignedStatus"])
        self.assertEqual(["start"], [action["id"] for action in result["assignedActions"]])
        self.assertEqual(["overdrive", "pause"], [action["id"] for action in result["runningActions"]])
        self.assertEqual("assigned", result["pausedStatus"])
        self.assertEqual("forge-line", result["selectedLaneId"])

    def test_feedback_surface_tracks_assignment_production_jam_overdrive_output_and_summary(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 1972, faultGraceTicks: 0 });
            const smeltEntry = state.queue.find((entry) => entry.jobTypeId === "smelt-circuits");
            state = game.selectJobCard(state, smeltEntry.id);
            state = game.selectLane(state, "forge-line");
            state = game.performContextAction(state, "assign");
            const assignedFeedback = game.laneFeedbackState(state, state.lanes.find((lane) => lane.id === "forge-line"));

            state = game.performContextAction(state, "start");
            const runningFeedback = game.laneFeedbackState(state, state.lanes.find((lane) => lane.id === "forge-line"));
            state = game.toggleLaneOverdrive(state, "forge-line", true);
            const overdriveFeedback = game.laneFeedbackState(state, state.lanes.find((lane) => lane.id === "forge-line"));
            state = game.stepFactory(state, 1);
            const jamFeedback = game.laneFeedbackState(state, state.lanes.find((lane) => lane.id === "forge-line"));
            state = game.performContextAction(state, "recover");
            const recoveryFeedback = game.laneFeedbackState(state, state.lanes.find((lane) => lane.id === "forge-line"));
            state = game.stepFactory(state, state.lanes.find((lane) => lane.id === "forge-line").recoveryRemaining);
            state = game.performContextAction(state, "start");
            state = game.stepFactory(state, state.lanes.find((lane) => lane.id === "forge-line").currentJob.remaining);

            const factoryFeedback = game.factoryFeedbackState(state);
            const resourceFeedback = game.resourceFeedbackState(state, "circuits");
            const upgradeFeedback = game.upgradeFeedbackState(state, game.GAME_DATA.upgrades[0], 0);
            const summaryFeedback = game.shiftSummaryFeedbackState(state);
            const queueFeedback = game.jobFeedbackState(state, game.GAME_DATA.jobTypes.find((job) => job.id === "weave-defenses"));

            console.log(JSON.stringify({
              proceduralAssets: game.GAME_DATA.assets.procedural,
              assignedFeedback,
              runningFeedback,
              overdriveFeedback,
              jamFeedback,
              recoveryFeedback,
              resourceFeedback,
              upgradeFeedback,
              summaryFeedback,
              queueFeedback,
              visualFeedbackSummary: state.visualFeedback.shiftSummary,
              factoryProducedCircuits: factoryFeedback.resources.circuits.produced,
            }));
            """
        )

        self.assertEqual("css:factory-floor-board", result["proceduralAssets"]["floorBoard"])
        self.assertEqual("assignment", result["assignedFeedback"]["feedback"])
        self.assertEqual("circuits", result["assignedFeedback"]["outputResource"])
        self.assertEqual("production", result["runningFeedback"]["feedback"])
        self.assertEqual("belt", result["runningFeedback"]["motion"])
        self.assertEqual("overdrive", result["overdriveFeedback"]["feedback"])
        self.assertEqual("fast", result["overdriveFeedback"]["motion"])
        self.assertEqual("hot", result["overdriveFeedback"]["heat"])
        self.assertEqual("jam", result["jamFeedback"]["feedback"])
        self.assertEqual("assets/fault-material-jam.png", result["jamFeedback"]["rasterAssets"]["fault"])
        self.assertEqual("recovery", result["recoveryFeedback"]["feedback"])
        self.assertEqual("diagnostic", result["recoveryFeedback"]["motion"])
        self.assertEqual("produced", result["resourceFeedback"]["feedback"])
        self.assertTrue(result["resourceFeedback"]["produced"])
        self.assertIn(result["upgradeFeedback"]["feedback"], {"available", "shortage", "installed"})
        self.assertEqual("overdrive", result["upgradeFeedback"]["family"])
        self.assertEqual("summary-open", result["summaryFeedback"]["feedback"])
        self.assertEqual("available", result["summaryFeedback"]["upgradeChoice"])
        self.assertEqual("summary-open", result["visualFeedbackSummary"]["feedback"])
        self.assertEqual("shortage", result["queueFeedback"]["feedback"])
        self.assertTrue(result["queueFeedback"]["shortage"])
        self.assertTrue(result["factoryProducedCircuits"])

    def test_signal_breach_surface_model_exposes_operator_visible_decisions(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 93, faultsEnabled: false, tutorialCompleted: true });
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
            let state = game.createInitialState({ seed: 331, faultsEnabled: false, tutorialCompleted: true });
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

    def test_crisis_arbitration_surface_model_exposes_actionable_operator_state(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/dark-factory-dispatch/dark-factory-dispatch.js");
            let state = game.createInitialState({ seed: 661, faultsEnabled: false, tutorialCompleted: true });
            state = game.stepFactory(state, 4);
            state.resources.circuits = 12;
            state.resources.power = 12;
            state.resources.drones = 4;
            state.resources.defenses = 4;
            state.resources.scrap = 30;
            state.resources.stability = 60;
            state.resources.reputation = 3;

            const beforeSurface = game.crisisArbitrationSurfaceState(state);
            const beforeCase = beforeSurface.cases.find((caseState) => caseState.id === "ashline-dock-priority");

            state = game.buyCrisisEmergencyOverride(state, "ashline-dock-priority");
            state = game.deferCrisisCase(state, "ashline-dock-priority");
            state = game.protectCrisisLane(state, "ashline-dock-priority");
            for (const sourceId of ["queue", "lane", "grid", "breach", "freight", "rail"]) {
              state = game.assignCrisisEvidence(state, "ashline-dock-priority", sourceId);
            }
            const readySurface = game.crisisArbitrationSurfaceState(state);
            const readyCase = readySurface.cases.find((caseState) => caseState.id === "ashline-dock-priority");
            state = game.ruleCrisisCase(state, "ashline-dock-priority", "freight-first");
            const ruledSurface = game.crisisArbitrationSurfaceState(state);
            const ruledCase = ruledSurface.cases.find((caseState) => caseState.id === "ashline-dock-priority");
            const lane = state.lanes.find((candidate) => candidate.id === "forge-line");
            const choices = game.campaignSurfaceState(state).choices;

            console.log(JSON.stringify({
              beforeSurface,
              beforeCase,
              readyCase,
              ruledSurface,
              ruledCase,
              lane,
              choices,
              latestLog: state.log[0],
            }));
            """
        )

        before = result["beforeCase"]
        ready = result["readyCase"]
        ruled = result["ruledCase"]

        self.assertEqual("v0.6.0 Crisis Arbitration", result["beforeSurface"]["release"])
        self.assertEqual("open", before["status"])
        self.assertEqual("forge-line", before["linked"]["laneId"])
        self.assertEqual("forge-bus", before["linked"]["sectorId"])
        self.assertEqual("spoofed-dispatch-uplink", before["linked"]["breachSourceId"])
        self.assertEqual("ashline-spare-crates", before["linked"]["manifestId"])
        self.assertEqual("ashline-rail-spoof", before["linked"]["railIncidentId"])
        self.assertEqual("perimeter-grid", before["linked"]["contractId"])
        self.assertGreater(before["dueTick"], before["openedAtTick"])
        self.assertIn("Grid First", [option["name"] for option in before["priorityOptions"]])
        self.assertEqual("docket-open", result["beforeSurface"]["status"])

        self.assertTrue(ready["override"]["spent"])
        self.assertEqual(1, ready["deferrals"])
        self.assertTrue(ready["protection"]["laneGuarded"])
        self.assertEqual(["queue", "lane", "grid", "breach", "freight", "rail"], [
            entry["sourceId"] for entry in ready["evidence"]["assigned"]
        ])
        self.assertGreaterEqual(ready["evidence"]["score"], ready["evidence"]["minimum"])
        self.assertEqual("ashline-dock-priority", result["lane"]["crisisProtection"]["caseId"])

        self.assertIn(ruled["status"], {"binding", "partial", "failed"})
        self.assertEqual("freight-first", ruled["ruling"]["priority"])
        self.assertEqual("resolved", ruled["ruling"]["status"])
        self.assertEqual(1, result["choices"]["crisisEmergencyOverrides"])
        self.assertEqual(1, result["choices"]["crisisDeferrals"])
        self.assertEqual(1, result["choices"]["crisisLaneProtections"])
        self.assertEqual(6, result["choices"]["crisisEvidenceAssignments"])
        self.assertEqual(1, result["choices"]["crisisFreightFirstRulings"])
        self.assertIn("priority ruling filed", result["latestLog"]["message"])

    def test_factory_floor_layout_contract_uses_named_areas_and_narrow_stacking(self) -> None:
        css = source_text("dark-factory-dispatch.css")

        for token in (
            '"left floor right"',
            '"actions actions log"',
            '"floor floor"',
            '"left right"',
            '"floor"',
            '"left"',
            '"right"',
            '"actions"',
            '"log"',
            ".operator-layout",
            ".factory-floor-panel",
            ".lane-board",
            ".context-actions",
            ".advanced-drawer",
            ".grid-summary,\n.freight-summary",
            ".grid-actions,\n.directive-actions",
            ".crisis-actions,\n.breach-actions",
        ):
            self.assertIn(token, css)

        self.assertNotIn("overflow-x: scroll", css)

    def test_mobile_first_viewport_contract_places_context_action_with_floor_preview(self) -> None:
        css = source_text("dark-factory-dispatch.css")
        narrow_start = css.index("@media (max-width: 720px)")
        short_start = css.index("@media (max-width: 720px) and (max-height: 760px)")
        narrow_css = css[narrow_start:short_start]
        short_css = css[short_start:]

        self.assertIn('"back header-actions"', narrow_css)
        self.assertIn('"identity identity"', narrow_css)
        self.assertIn('"objective objective"', narrow_css)
        self.assertIn('"stats stats"', narrow_css)
        self.assertIn("grid-template-columns: repeat(4, minmax(0, 1fr));", narrow_css)

        action_index = narrow_css.index('"actions"')
        floor_index = narrow_css.index('"floor"')
        left_index = narrow_css.index('"left"')
        self.assertLess(action_index, floor_index)
        self.assertLess(floor_index, left_index)

        factory_cap = int(re.search(r"\.factory-floor-panel \{\s+max-height: (\d+)px;", short_css).group(1))
        lane_board_cap = int(re.search(r"\.lane-board \{\s+max-height: (\d+)px;", short_css).group(1))
        action_min = int(re.search(r"\.actions-panel \.context-actions \{\s+min-height: (\d+)px;", short_css).group(1))
        panel_head_min = int(re.search(r"\.panel-head \{\s+min-height: (\d+)px;", short_css).group(1))
        mobile_gap = 8
        mobile_header_budget = 320

        self.assertEqual(280, factory_cap)
        self.assertGreaterEqual(lane_board_cap, 220)
        self.assertLessEqual(
            mobile_header_budget + panel_head_min + action_min + mobile_gap + factory_cap,
            740,
        )

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
        self.assertNotIn("assets/crisis-", combined)
        self.assertNotIn("assets/arbitration-", combined)
        self.assertNotIn("assets/docket-", combined)

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
