import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import credits from "../../../../../media/data/credits.json";
import { IWindow } from "../../window/window.component";

@Component({
	templateUrl: "./credits.component.html",
	styleUrls: ["./credits.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditsComponent implements OnInit, AfterViewInit, IWindow {
	@ViewChild("text")
	private _text!: ElementRef<HTMLPreElement>;
	private _textAnimation!: Animation;
	private _parallaxAnimation!: Animation;

	protected credits!: Credit[];

	public title: string = "Credits";

	public constructor(
		private _changeDetector: ChangeDetectorRef,
		private _elementRef: ElementRef
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

		this._textAnimation = textContainer.getAnimations()[0];
		this._parallaxAnimation = this._elementRef.nativeElement.getAnimations()[0];
	}

	@HostListener("wheel", ["$event"])
	protected onWheel(e: WheelEvent) {
		e.preventDefault();
		e.stopPropagation();

		const movementDelta = e.deltaY * 10;
		(<number>this._textAnimation.currentTime) = Math.max((<number>this._textAnimation.currentTime) + movementDelta, 0);
		(<number>this._parallaxAnimation.currentTime) = Math.max((<number>this._parallaxAnimation.currentTime) + movementDelta, 0);
	}

	private _drag: boolean = false;

	@HostListener("pointerdown")
	private onPointerDown() {
		this._drag = false;
	}

	@HostListener("pointermove")
	private onPointerMove() {
		this._drag = true;
	}

	@HostListener("pointerup")
	private onPointerUp() {
		if (this._drag) {
			return;
		}

		const newPlaybackRate = Number(!this._textAnimation.playbackRate);
		this._textAnimation.updatePlaybackRate(newPlaybackRate);
		this._parallaxAnimation.updatePlaybackRate(newPlaybackRate);
	}
}

interface Credit {
	section: string,
	titles: {
		title: string,
		names: string[]
	}[]
}