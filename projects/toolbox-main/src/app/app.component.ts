import { AfterViewInit, Component, ViewChild, ViewContainerRef } from "@angular/core";
import packageJson from "../../../../package.json";
import { PanoramaService } from "./common/services/panorama-service/panorama.service";
import { TitleService } from "./common/services/title-service/title.service";
import { ToolboxSettingsService } from "./common/services/toolbox-settings/toolbox-settings.service";
import { WindowService } from "./common/services/window-service/window.service";

@Component({
	selector: "tbx-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent implements AfterViewInit {
	protected readonly version = packageJson.version;

	@ViewChild("windowContainer", { read: ViewContainerRef })
	protected windowContainerTarget!: ViewContainerRef;
	protected musicPlayerEnabled = false;

	public constructor(
		private _window: WindowService,

		//This essentially bootstraps the services to the start of the application.
		toolboxSettings: ToolboxSettingsService,
		panorama: PanoramaService,
		titleService: TitleService
	) {
		toolboxSettings.Observe.musicPlayerEnabled
			.subscribe(musicPlayerEnabled => this.musicPlayerEnabled = musicPlayerEnabled);
	}

	public ngAfterViewInit() {
		this._window.windowContainer = this.windowContainerTarget;
	}
}