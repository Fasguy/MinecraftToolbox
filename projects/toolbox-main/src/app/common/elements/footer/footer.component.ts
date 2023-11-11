import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { WindowService } from "../../services/window-service/window.service";
import { ChangelogComponent } from "../../views/windows/changelog/changelog.component";
import { CreditsComponent } from "../../views/windows/credits/credits.component";
import { SettingsComponent } from "../../views/windows/settings/settings.component";

@Component({
	selector: "tbx-footer",
	templateUrl: "./footer.component.html",
	styleUrls: ["./footer.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements AfterViewInit {
	protected currentYear = new Date().getFullYear();

	public constructor(
		private _window: WindowService,
		private _changeDetector: ChangeDetectorRef
	) {
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();
	}

	protected createCreditsWindow = () => this._window.createWindow(CreditsComponent);
	protected createChangelogWindow = () => this._window.createWindow(ChangelogComponent);
	protected createSettingsWindow = () => this._window.createWindow(SettingsComponent);
}