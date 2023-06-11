import { AfterViewInit, Directive, ElementRef, Renderer2, ViewChild, ViewContainerRef } from "@angular/core";

/*
This abstract component acts like a global template that can be used without needing an entire wrapper component.

Example:
	<input type="checkbox" standard>

	can be extended into

	<input type="checkbox" standard>
	<span>Text</span>

	instead of

	<other-component>
		<input type="checkbox" standard>
		<span>Text</span>
	</other-component>

Things to note, when using this:
- The host element will be placed wherever the "hostPlaceholder" element is.
- An optional new host can be assigned by marking an element with "newHost".
- The ":host" selector will not work, as there isn't actually a host element (unless "newHost" is set).
*/
@Directive()
export abstract class AbstractHostExtender implements AfterViewInit {
	@ViewChild('hostPlaceholder')
	private _hostPlaceholder!: ElementRef<HTMLElement>;

	@ViewChild('newHost')
	private _newHost?: ElementRef<HTMLElement>;

	public constructor(
		private _viewContainerRef: ViewContainerRef,
		private _renderer: Renderer2
	) {
	}

	public ngAfterViewInit() {
		let originalHost: HTMLElement = this._viewContainerRef.element.nativeElement;
		let newHost: HTMLElement | undefined = this._newHost?.nativeElement;

		while (originalHost.childNodes.length > 0) {
			originalHost.parentElement!.insertBefore(originalHost.childNodes[0], originalHost);
		}

		const hostAttr = (<any>this._renderer).hostAttr;
		const contentAttr = (<any>this._renderer).contentAttr;

		this._hostPlaceholder.nativeElement.replaceWith(this._viewContainerRef.element.nativeElement);
		originalHost.setAttribute(contentAttr, "");
		originalHost.removeAttribute(hostAttr);

		if (newHost) {
			newHost.setAttribute(hostAttr, "");
			newHost.removeAttribute(contentAttr);
		}

		this._viewContainerRef.detach();
	}
}