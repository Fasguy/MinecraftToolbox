import { HttpClient } from "@angular/common/http";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
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

	public constructor(
		private _httpClient: HttpClient,
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

					this._httpClient
						.get("resources/data/splashes.txt", { responseType: "text" })
						.subscribe(text => {
							let lines = text.split("\n").map(line => line.trim());
							let splash = lines[Math.floor(Math.random() * lines.length)];
							this._splashText.nativeElement.innerText = splash;
							document.fonts.ready.then(() => {
								if (document.fonts.check("1em Minecraft")) {
									this.fitText(this._splashText.nativeElement);
								}
							});
						});
				}
				else {
					this._splashText.nativeElement.style.display = "none";
				}
			});
	}

	private fitText(element: HTMLElement) {
		let i = MINSIZE;
		let overflow = false;

		const parent = element.parentElement;

		while (!overflow && i < MAXSIZE) {
			element.style.fontSize = `${i}px`;
			overflow = this.isOverflown(parent!);

			if (!overflow) i += STEP;
		}

		let fontSizePx = i - STEP;

		element.style.fontSize = `${fontSizePx}px`;

		let shadowOffset = (2 / 16) * fontSizePx;
		element.style.textShadow = `${shadowOffset}px ${shadowOffset}px #3f3f3f`;
	}

	private isOverflown({ clientWidth, clientHeight, scrollWidth, scrollHeight }: HTMLElement) {
		return (scrollWidth > clientWidth) || (scrollHeight > clientHeight);
	}
}

const MINSIZE = 0;
const MAXSIZE = 19;
const STEP = 0.1;