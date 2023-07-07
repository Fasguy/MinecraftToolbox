import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { NetRequestService } from "src/app/common/services/net-request/net-request.service";
import { ToolboxSettingsService } from "src/app/common/services/toolbox-settings/toolbox-settings.service";

@Component({
	selector: "tbx-splash",
	templateUrl: "./splash.component.html",
	styleUrls: ["./splash.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashComponent implements AfterViewInit {
	@ViewChild("splashText")
	private _splashText!: ElementRef<HTMLElement>
	@ViewChild("splashSizer")
	private _splashSizer!: ElementRef<HTMLElement>

	public constructor(
		private _netRequest: NetRequestService,
		private _toolboxSettings: ToolboxSettingsService,
		private _changeDetector: ChangeDetectorRef
	) {
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();

		this._toolboxSettings.Observe.uselessVisualsEnabled
			.subscribe(uselessVisualsEnabled => {
				if (uselessVisualsEnabled) {
					this._splashText.nativeElement.style.removeProperty("display");

					this._netRequest
						.get<string>("resources/data/splashes.txt", { responseType: "text" })
						.subscribe(text => {
							let lines = text.split("\n").map(line => line.trim());
							let splash = lines[Math.floor(Math.random() * lines.length)];
							this._splashText.nativeElement.innerText = splash;
							document.fonts.ready.then(() => {
								if (document.fonts.check("1em Minecraft")) {
									this._splashText.nativeElement.style.fontSize = "1em";
									const splashWidth = Math.max(this._splashSizer.nativeElement.parentElement!.clientWidth, this._splashSizer.nativeElement.clientWidth);
									this._splashSizer.nativeElement.style.transform = `scale(${this._splashSizer.nativeElement.parentElement!.clientWidth / splashWidth})`;
								}
							});
						});
				}
				else {
					this._splashText.nativeElement.style.display = "none";
				}
			});
	}
}