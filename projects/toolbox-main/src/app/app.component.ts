import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import packageJson from '../../../../package.json';
import { PanoramaService } from './common/services/panorama-service/panorama.service';
import { TitleService } from './common/services/title-service/title.service';
import { ToolboxSettingsService } from './common/services/toolbox-settings/toolbox-settings.service';
import { WindowService } from './common/services/window-service/window.service';

@Component({
	selector: 'tbx-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	public version = packageJson.version;

	@ViewChild('windowContainer', { read: ViewContainerRef })
	public windowContainerTarget!: ViewContainerRef;

	constructor(
		private _toolboxSettings: ToolboxSettingsService,
		private _panorama: PanoramaService,
		private _window: WindowService,
		private _titleService: TitleService
	) {
	}

	ngAfterViewInit() {
		this._window.windowContainer = this.windowContainerTarget;
	}
}