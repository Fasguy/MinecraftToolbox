import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';

@Component({
	selector: '[tooltip]',
	template: '<ng-content></ng-content>',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent {
	private static _tooltipDisplay = (() => {
		let tooltip = document.createElement("div");
		tooltip.classList.add("tooltip");
		document.body.appendChild(tooltip);
		return tooltip;
	})();

	@Input()
	public tooltip!: string;

	public constructor(element: ElementRef<HTMLElement>) {
		element.nativeElement.parentElement!.addEventListener("mouseenter", () => {
			TooltipComponent._tooltipDisplay.style.display = "block";
			TooltipComponent._tooltipDisplay.appendChild(element.nativeElement);
		});

		element.nativeElement.parentElement!.addEventListener("mouseleave", () => {
			TooltipComponent._tooltipDisplay.style.removeProperty("display");
			TooltipComponent._tooltipDisplay.innerHTML = "";
		});

		element.nativeElement.parentElement!.addEventListener("mousemove", (e: MouseEvent) => {
			TooltipComponent._tooltipDisplay.style.left = `${e.clientX + 10}px`;
			TooltipComponent._tooltipDisplay.style.top = `${e.clientY + 10}px`;
		});

		element.nativeElement.remove();
	}
}