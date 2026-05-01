import json
import re
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "iron-lantern-descent"
MANIFEST_PATH = GAME_DIR / "assets" / "asset-manifest.json"


def source_text(filename: str) -> str:
    return (GAME_DIR / filename).read_text(encoding="utf-8")


class IronLanternDescentFaultlineSurfaceTests(unittest.TestCase):
    def test_faultline_survey_dom_exposes_readouts_controls_and_logs(self) -> None:
        html = source_text("index.html")
        css = source_text("iron-lantern-descent.css")

        for token in (
            "v0.4.0 echo relay network",
            "survey-readout",
            "stability-readout",
            "pumpworks-readout",
            "flood-readout",
            "valve-readout",
            "drainage-readout",
            "Cinder Vents",
            "vent-readout",
            "airflow-readout",
            "filter-readout",
            "gas-readout",
            "Echo Relays",
            "relay-readout",
            "cable-readout",
            "echo-readout",
            "rescue-readout",
            "tremor-readout",
            "map-readout",
            "survey-site-list",
            "pumpworks-site-list",
            "vent-site-list",
            "relay-site-list",
            "event-log",
            "stake-action",
            "brace-action",
            "chart-action",
            "cache-action",
            "pump-action",
            "valve-action",
            "siphon-action",
            "seal-action",
            "gate-action",
            "filter-action",
            "fan-action",
            "vent-action",
            "relay-action",
            "cable-action",
            "echo-action",
            "rescue-action",
            "beacon-action",
        ):
            self.assertIn(token, html)

        for token in (
            ".survey-list",
            ".pumpworks-list",
            ".vent-list",
            ".relay-list",
            ".survey-line",
            ".pumpworks-line",
            ".vent-line",
            ".relay-line",
            ".survey-meta",
            ".pumpworks-meta",
            ".vent-meta",
            ".relay-meta",
            ".event-log",
            'li[data-window="tremor"]',
            'li[data-window="flood"]',
            'li[data-window="gas"]',
            'li[data-window="noisy"]',
            'li[data-status="success"]',
            'li[data-state="success"]',
            'li[data-gate="open"]',
            'li[data-fan="running"]',
            'li[data-cable="spooled"]',
            'li[data-beacon="fired"]',
            "overflow-wrap: anywhere",
            "grid-template-columns: repeat(2, minmax(0, 1fr))",
        ):
            self.assertIn(token, css)

        self.assertNotIn("https://", html)
        self.assertNotIn("http://", html)

    def test_faultline_surface_hooks_render_live_survey_state(self) -> None:
        script = source_text("iron-lantern-descent.js")

        for token in (
            "formatSurveyWindow",
            "activeSurveySite",
            "surveyRequirementText",
            'dom["survey-readout"].textContent',
            'dom["stability-readout"].textContent',
            'dom["tremor-readout"].textContent',
            'dom["map-readout"].textContent',
            'dom["survey-site-list"].replaceChildren',
            'dom["event-log"].replaceChildren',
            'dom["stake-action"].addEventListener',
            'dom["brace-action"].addEventListener',
            'dom["chart-action"].addEventListener',
            'dom["cache-action"].addEventListener',
            "plantSurveyStake(currentState)",
            "braceSurveySite(currentState)",
            "chartFaultSurvey(currentState)",
            "activateAirCache(currentState)",
        ):
            self.assertIn(token, script)

    def test_deep_pumpworks_surface_hooks_render_live_station_state(self) -> None:
        script = source_text("iron-lantern-descent.js")

        for token in (
            "formatPumpworksWindow",
            "activePumpworksSite",
            "pumpworksRequirementText",
            "pumpworksLineText",
            "formatVentWindow",
            "activeVentSite",
            "ventRequirementText",
            "ventLineText",
            "formatRelayWindow",
            "activeRelaySite",
            "relayRequirementText",
            "relayLineText",
            'dom["pumpworks-readout"].textContent',
            'dom["flood-readout"].textContent',
            'dom["valve-readout"].textContent',
            'dom["drainage-readout"].textContent',
            'dom["vent-readout"].textContent',
            'dom["airflow-readout"].textContent',
            'dom["filter-readout"].textContent',
            'dom["gas-readout"].textContent',
            'dom["relay-readout"].textContent',
            'dom["cable-readout"].textContent',
            'dom["echo-readout"].textContent',
            'dom["rescue-readout"].textContent',
            'dom["pumpworks-site-list"].replaceChildren',
            'dom["vent-site-list"].replaceChildren',
            'dom["relay-site-list"].replaceChildren',
            'dom["pump-action"].addEventListener',
            'dom["valve-action"].addEventListener',
            'dom["siphon-action"].addEventListener',
            'dom["seal-action"].addEventListener',
            'dom["gate-action"].addEventListener',
            'dom["filter-action"].addEventListener',
            'dom["fan-action"].addEventListener',
            'dom["vent-action"].addEventListener',
            'dom["relay-action"].addEventListener',
            'dom["cable-action"].addEventListener',
            'dom["echo-action"].addEventListener',
            'dom["rescue-action"].addEventListener',
            'dom["beacon-action"].addEventListener',
            "primePumpStation(currentState)",
            "turnPressureValve(currentState)",
            "deploySiphonCharge(currentState)",
            "sealLeakSeam(currentState)",
            "openDraftGate(currentState)",
            "deployFilterCartridge(currentState)",
            "startPressureFan(currentState)",
            "ventGasPocket(currentState)",
            "repairRelayPylon(currentState)",
            "spoolRelayCable(currentState)",
            "triangulateEchoRoute(currentState)",
            "claimRescueCache(currentState)",
            "fireLiftBeacon(currentState)",
        ):
            self.assertIn(token, script)

    def test_faultline_visuals_are_procedural_and_manifest_stays_truthful(self) -> None:
        script = source_text("iron-lantern-descent.js")
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        manifest_paths = {asset["path"].removeprefix("games/iron-lantern-descent/") for asset in manifest["assets"]}

        for token in (
            "createSurveySiteMesh",
            "updateSurveyMeshes",
            "surveyMeshes",
            "new THREE.BufferGeometry().setFromPoints",
            "new THREE.TorusGeometry",
            "userData.role = \"fault-seam\"",
            "userData.role = \"survey-stake\"",
            "userData.role = \"brace-frame\"",
            "userData.role = \"air-cache\"",
            "userData.role = \"map-plate\"",
            "createPumpworksSiteMesh",
            "updatePumpworksMeshes",
            "pumpworksMeshes",
            "userData.role = \"pump-housing\"",
            "userData.role = \"valve-wheel\"",
            "userData.role = \"flood-plane\"",
            "userData.role = \"leak-seam\"",
            "userData.role = \"siphon-canister\"",
            "userData.role = \"pressure-gauge\"",
            "userData.role = \"drainage-route-overlay\"",
            "createVentSiteMesh",
            "updateVentMeshes",
            "ventMeshes",
            "userData.role = \"vent-shaft\"",
            "userData.role = \"draft-gate-wheel\"",
            "userData.role = \"fan-housing\"",
            "userData.role = \"filter-rack\"",
            "userData.role = \"gas-haze-volume\"",
            "userData.role = \"fresh-air-relay-marker\"",
            "userData.role = \"airflow-overlay\"",
            "createRelaySiteMesh",
            "updateRelayMeshes",
            "relayMeshes",
            "userData.role = \"relay-pylon\"",
            "userData.role = \"signal-cable-line\"",
            "userData.role = \"echo-pulse-marker\"",
            "userData.role = \"rescue-cache-locker\"",
            "userData.role = \"emergency-beacon-hardware\"",
            "userData.role = \"cable-break-sparks\"",
            "userData.role = \"route-signal-overlay\"",
            "0x4bd6c0",
            "0xd46857",
            "0xc9a653",
        ):
            self.assertIn(token, script)

        self.assertEqual("complete", manifest["status"])
        self.assertEqual(
            {
                "assets/lantern-anchor.png",
                "assets/mineral-vein-material.png",
                "assets/drill-tool.png",
                "assets/oxygen-light-icons.png",
                "assets/arcade-title-card.png",
            },
            manifest_paths,
        )
        for stale_raster in (
            "fault",
            "survey",
            "brace",
            "cache",
            "map-plate",
            "tremor",
            "pump",
            "valve",
            "flood",
            "leak",
            "siphon",
            "gauge",
            "drain",
            "vent",
            "draft",
            "fan",
            "filter",
            "gas",
            "airflow",
            "relay",
            "pylon",
            "cable",
            "echo",
            "beacon",
        ):
            self.assertNotRegex(script, rf'assets/[^"\'\)\s]*{re.escape(stale_raster)}[^"\'\)\s]*\.png')

    def test_surface_controls_change_survey_state_and_route_pressure(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 83 });
            state.player.position = { x: 17, y: 1.6, z: -31 };
            state.elapsed = 40;
            state = game.syncDerivedState(state);
            const before = {
              stability: state.routeStability.stability,
              routeConfidence: state.route.returnConfidence,
              oxygen: state.oxygen.current,
              lastLog: state.log[0].message,
            };
            state = game.plantSurveyStake(state, "survey-cinder-rib");
            const staked = {
              stability: state.routeStability.stability,
              routeConfidence: state.route.returnConfidence,
              stakes: state.survey.stakes,
              lastLog: state.log[0].message,
            };
            state = game.chartFaultSurvey(state, "survey-cinder-rib");
            const charted = {
              chartState: state.surveySites[0].chartState,
              mapProgress: state.survey.mapProgress,
              surveyValue: state.survey.value,
              oxygen: state.oxygen.current,
              lastLog: state.log[0].message,
            };

            console.log(JSON.stringify({ before, staked, charted }));
            """
        )

        self.assertGreater(result["staked"]["stability"], result["before"]["stability"])
        self.assertGreater(result["staked"]["routeConfidence"], result["before"]["routeConfidence"])
        self.assertEqual(1, result["staked"]["stakes"])
        self.assertIn("survey stake planted", result["staked"]["lastLog"])
        self.assertEqual("partial", result["charted"]["chartState"])
        self.assertEqual(0.5, result["charted"]["mapProgress"])
        self.assertEqual(18, result["charted"]["surveyValue"])
        self.assertLess(result["charted"]["oxygen"], result["before"]["oxygen"])
        self.assertIn("chart partial", result["charted"]["lastLog"])

    def test_surface_controls_change_pumpworks_state_route_and_rewards(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 87 });
            const survey = state.surveySites.find((site) => site.id === "survey-cinder-rib");
            state.player.position = { x: survey.position.x, y: 1.6, z: survey.position.z };
            state.elapsed = 40;
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.plantSurveyStake(state, "survey-cinder-rib");
            state = game.chartFaultSurvey(state, "survey-cinder-rib");

            const pump = state.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            state.player.position = { x: pump.position.x, y: 1.6, z: pump.position.z };
            state.elapsed = 50;
            state = game.syncDerivedState(state);
            const before = {
              flood: state.pumpworksSites[0].floodLevel,
              routeConfidence: state.route.returnConfidence,
              oxygen: state.oxygen.current,
            };
            state = game.primePumpStation(state, "pump-cinder-sump");
            const primed = JSON.parse(JSON.stringify(state));
            state = game.turnPressureValve(state, "pump-cinder-sump");

            console.log(JSON.stringify({
              before,
              primedFlood: primed.pumpworksSites[0].floodLevel,
              primedState: primed.pumpworksSites[0].pumpState,
              drainedState: state.pumpworksSites[0].drainageState,
              valveState: state.pumpworksSites[0].valveState,
              floodAfter: state.pumpworksSites[0].floodLevel,
              pumpworksValue: state.pumpworks.value,
              pumpworksMap: state.pumpworks.mapProgress,
              routeAfter: state.route.returnConfidence,
              oxygenAfter: state.oxygen.current,
              lastLog: state.log[0].message,
            }));
            """
        )

        self.assertEqual("primed", result["primedState"])
        self.assertLess(result["primedFlood"], result["before"]["flood"])
        self.assertEqual("success", result["drainedState"])
        self.assertEqual("regulated", result["valveState"])
        self.assertLess(result["floodAfter"], result["primedFlood"])
        self.assertEqual(64, result["pumpworksValue"])
        self.assertEqual(1, result["pumpworksMap"])
        self.assertGreater(result["routeAfter"], result["before"]["routeConfidence"])
        self.assertLess(result["oxygenAfter"], result["before"]["oxygen"])
        self.assertIn("pressure valve success", result["lastLog"])

    def test_surface_controls_change_cinder_vent_state_route_and_rewards(self) -> None:
        result = self.run_node(
            """
            const game = require("./games/iron-lantern-descent/iron-lantern-descent.js");
            let state = game.createInitialState({ seed: 91 });
            const survey = state.surveySites.find((site) => site.id === "survey-cinder-rib");
            state.player.position = { x: survey.position.x, y: 1.6, z: survey.position.z };
            state = game.placeLantern(game.syncDerivedState(state));
            state = game.plantSurveyStake(state, "survey-cinder-rib");
            state = game.chartFaultSurvey(state, "survey-cinder-rib");

            const pump = state.pumpworksSites.find((site) => site.id === "pump-cinder-sump");
            state.player.position = { x: pump.position.x, y: 1.6, z: pump.position.z };
            state.elapsed = 50;
            state = game.primePumpStation(game.syncDerivedState(state), "pump-cinder-sump");
            state = game.turnPressureValve(state, "pump-cinder-sump");

            const vent = state.ventSites.find((site) => site.id === "vent-cinder-rib-draft");
            state.player.position = { x: vent.position.x, y: 1.6, z: vent.position.z };
            state.elapsed = 70;
            state = game.syncDerivedState(state);
            const before = {
              gas: state.ventSites[0].gasPressure,
              routeConfidence: state.route.returnConfidence,
              oxygen: state.oxygen.current,
              drain: game.oxygenDrainRate(state),
            };
            state = game.openDraftGate(state, "vent-cinder-rib-draft");
            const gated = JSON.parse(JSON.stringify(state));
            state = game.startPressureFan(state, "vent-cinder-rib-draft");
            state = game.ventGasPocket(state, "vent-cinder-rib-draft");

            console.log(JSON.stringify({
              before,
              gateState: gated.ventSites[0].gateState,
              fanState: state.ventSites[0].fanState,
              relayState: state.ventSites[0].relayState,
              gasState: state.ventSites[0].gasState,
              gasAfter: state.ventSites[0].gasPressure,
              staleAfter: state.ventSites[0].staleAirPressure,
              ventValue: state.ventNetwork.value,
              ventMap: state.ventNetwork.mapProgress,
              airflowRelief: state.ventNetwork.airflowRelief,
              routeAfter: state.route.returnConfidence,
              oxygenAfter: state.oxygen.current,
              drainAfter: game.oxygenDrainRate(state),
              lastLog: state.log[0].message,
            }));
            """
        )

        self.assertEqual("open", result["gateState"])
        self.assertEqual("running", result["fanState"])
        self.assertEqual("success", result["relayState"])
        self.assertEqual("cleared", result["gasState"])
        self.assertLess(result["gasAfter"], result["before"]["gas"])
        self.assertLess(result["staleAfter"], 0.2)
        self.assertEqual(72, result["ventValue"])
        self.assertEqual(1, result["ventMap"])
        self.assertEqual(18, result["airflowRelief"])
        self.assertGreater(result["routeAfter"], result["before"]["routeConfidence"])
        self.assertLess(result["oxygenAfter"], result["before"]["oxygen"])
        self.assertLess(result["drainAfter"], result["before"]["drain"])
        self.assertIn("gas pocket success", result["lastLog"])

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
