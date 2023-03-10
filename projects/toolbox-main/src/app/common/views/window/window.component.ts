import { Component, ComponentRef, Type, ViewChild, ViewContainerRef } from "@angular/core";

@Component({
	selector: "tbx-window",
	templateUrl: "./window.component.html",
	styleUrls: ["./window.component.scss"]
})
export class WindowComponent<TWindow extends IWindow> {
	@ViewChild("childView", { read: ViewContainerRef })
	protected childViewTarget!: ViewContainerRef;

	protected title: string = "";

	public selfRef!: ComponentRef<WindowComponent<TWindow>>;

	public createChildComponent(component: Type<TWindow>) {
		let windowContentRef = this.childViewTarget.createComponent(component);
		this.title = windowContentRef.instance.title;

		return windowContentRef;
	}

	public close() {
		this.selfRef.destroy();
	}
}

export interface IWindow {
	title: string;
}