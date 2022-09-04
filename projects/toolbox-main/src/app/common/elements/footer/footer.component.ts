import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WindowService } from '../../services/window-service/window.service';
import { ChangelogComponent } from '../../views/windows/changelog/changelog.component';
import { CreditsComponent } from '../../views/windows/credits/credits.component';
import { SettingsComponent } from '../../views/windows/settings/settings.component';

@Component({
	selector: 'tbx-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
	protected currentYear = new Date().getFullYear();
	protected items = [
		{
			text: "Credits",
			click: () => this._window.createWindow(CreditsComponent)
		},
		{
			text: "GitHub",
			click: () => window.open("https://github.com/Fasguy/MinecraftToolbox", "_blank", "noopener,noreferrer")
		},
		{
			text: "Changelog",
			click: () => this._window.createWindow(ChangelogComponent)
		},
		{
			text: "Settings",
			click: () => this._window.createWindow(SettingsComponent)
		},
		{
			text: "Discord",
			click: () => window.open("https://fasguy.net/discord", "_blank", "noopener,noreferrer")
		}
	];

	public constructor(
		private _window: WindowService
	) {
	}
}