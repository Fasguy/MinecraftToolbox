import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import credits from "../../../../../resources/data/credits.json";

@Component({
	templateUrl: './credits.component.html',
	styleUrls: ['./credits.component.scss']
})
export class CreditsComponent implements OnInit, OnDestroy, AfterViewInit {
	private _animationFrame!: number;

	@ViewChild("text")
	private _text!: ElementRef<HTMLPreElement>;

	public credits!: Credit[];

	ngOnInit(): void {
		this.credits = credits;
	}

	ngAfterViewInit(): void {
		this.animate();
	}

	ngOnDestroy(): void {
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