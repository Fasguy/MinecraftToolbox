import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import credits from "../../../../../resources/data/credits.json";
import { IWindow } from "../../window/window.component";

@Component({
	templateUrl: "./credits.component.html",
	styleUrls: ["./credits.component.scss"]
})
export class CreditsComponent implements OnInit, OnDestroy, AfterViewInit, IWindow {
	private _animationFrame!: number;

	@ViewChild("text")
	private _text!: ElementRef<HTMLPreElement>;

	protected credits!: Credit[];

	public title: string = "Credits";

	public ngOnInit(): void {
		this.credits = credits;
	}

	public ngAfterViewInit(): void {
		this.animate();
	}

	public ngOnDestroy(): void {
		window.cancelAnimationFrame(this._animationFrame);
	}

	@HostListener("window:resize")
	public animate() {
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