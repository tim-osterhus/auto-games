import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "games" / "corebound"


class CoreboundOnboardingHelpTests(unittest.TestCase):
    def test_help_surface_and_objective_dom_contract_are_present(self) -> None:
        html = (GAME_DIR / "index.html").read_text(encoding="utf-8")

        for element_id in (
            "help-toggle",
            "help-surface",
            "help-version",
            "help-objective-title",
            "help-objective-detail",
            "help-quick-start",
            "help-system-list",
            "help-return-surface",
            "help-reset-run",
            "objective-status",
            "objective-title",
            "objective-detail",
            "objective-list",
        ):
            self.assertIn(element_id, html)
        self.assertIn('aria-controls="help-surface"', html)
        self.assertIn('aria-label="Corebound menu and help"', html)
        self.assertIn("Run reset actions", html)

    def test_onboarding_ladder_and_reveal_rules_are_state_driven(self) -> None:
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        for behavior in (
            "ONBOARDING_STEPS",
            "markOnboarding",
            "renderObjectivePanel",
            "renderHelpSurface",
            "contractsLayerOpen",
            "chartersLayerOpen",
            "routesLayerOpen",
            "archiveLayerOpen",
            "facilityLayerOpen",
            "researchLayerOpen",
            "setPanelDisclosure",
            "renderLockedList",
            "recallRunFromHelp",
            "resetCurrentRun",
            "setHelpOpen",
            "launch shaft",
        ):
            self.assertIn(behavior, script)
        for staged_copy in (
            "Contracts unlock after first cargo turn-in.",
            "Deep Charters open after a filed commission.",
            "Late routes unlock after contract or charter progress.",
            "Research desk unlocks after refined samples.",
        ):
            self.assertIn(staged_copy, script)
        for milestone in (
            "launched",
            "heldMove",
            "drilled",
            "oreLoaded",
            "checkedMeters",
            "returned",
            "cargoSettled",
        ):
            self.assertIn(milestone, script)

    def test_help_and_progressive_disclosure_styles_are_mobile_safe(self) -> None:
        css = (GAME_DIR / "corebound.css").read_text(encoding="utf-8")

        for selector in (
            ".help-toggle",
            ".help-surface",
            ".help-actions",
            ".objective-panel",
            ".objective-step",
            ".panel-locked",
            ".panel-lock-row",
            ".help-system-row",
        ):
            self.assertIn(selector, css)
        self.assertIn("max-height: min(72vh, 640px);", css)
        self.assertIn("grid-template-columns: minmax(0, 1fr) 42px;", css)

    def test_release_metadata_feeds_help_version_surface(self) -> None:
        data = (GAME_DIR / "corebound-data.js").read_text(encoding="utf-8")
        script = (GAME_DIR / "corebound.js").read_text(encoding="utf-8")

        self.assertIn("release", data)
        self.assertIn('version: "v0.4.0"', data)
        self.assertIn('snapshot: "Natural Motion plus first-session pacing"', data)
        self.assertIn("GAME_RELEASE.version", script)
        self.assertIn("GAME_RELEASE.snapshot", script)


if __name__ == "__main__":
    unittest.main()
