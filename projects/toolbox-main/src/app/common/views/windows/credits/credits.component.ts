import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import credits from "../../../../../resources/data/credits.json";
import { IWindow } from "../../window/window.component";

@Component({
	templateUrl: "./credits.component.html",
	styleUrls: ["./credits.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditsComponent implements OnInit, AfterViewInit, IWindow {
	@ViewChild("text")
	private _text!: ElementRef<HTMLPreElement>;

	protected credits!: Credit[];

	public title: string = "Credits";

	public constructor(
		private _changeDetector: ChangeDetectorRef,
	) {
	}

	public ngOnInit(): void {
		this.credits = credits;
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();

		this.animate();
	}

	@HostListener("window:resize")
	private animate() {
		const textContainer = this._text.nativeElement;
		const speed = 30;
		textContainer.style.animationDuration = `${textContainer.clientHeight / speed}s`;

		document.documentElement.style.setProperty("--startPos", `${textContainer.parentElement?.clientHeight}px`);
	}
}

interface Credit {
	section: string,
	titles: {
		title: string,
		names: string[]
	}[]
}