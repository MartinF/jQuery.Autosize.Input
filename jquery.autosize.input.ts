/// <reference path="jquery.d.ts" />

interface JQuery {
	autosizeInput(): JQuery;
}

module Plugins {
	export interface IAutosizeInput {
		update(): void;
	}

	export interface IAutosizeInputOptions {
		space: number;
	}
	
	export class AutosizeInput implements IAutosizeInput {
		private _input: JQuery;
		private _mirror: JQuery;
		private _options: IAutosizeInputOptions;

		constructor(input: HTMLElement, options: IAutosizeInputOptions) {
			this._input = $(input);
			this._options = options;

			// Init mirror
			this._mirror = $('<span style="position:absolute; top:-999px; left:0; white-space:pre;"/>');
			// Copy to mirror
			$.each(['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent'], (i, val) => {
				this._mirror[0].style[val] = this._input.css(val);
			});
			$("body").append(this._mirror);

			// Bind events - change update paste click mousedown mouseup focus blur
			// IE 9 need keydown to keep updating while deleting (keeping backspace in - else it will first update when backspace is released)
			// IE 9 need keyup incase text is selected and backspace/deleted is hit - keydown is to early
			// How to fix problem with hitting the delete "X" in the box - but not updating!? mouseup is apparently to early
			// Could bind separatly and set timer
			// Add so it automatically updates if value of input is changed http://stackoverflow.com/a/1848414/58524
			this._input.on("keydown keyup input propertychange change", (e) => { this.update(); });

			// Update
			(() => { this.update(); })();
		}

		public get options(): IAutosizeInputOptions {
			return this._options;
		}

		public static get instanceKey(): string {
			// Use camelcase because .data()['autosize-input-instance'] will not work
			return "autosizeInputInstance";
		}

		public update() {
			var value = this._input.val();

			if (!value) {
				// If no value, use placeholder if set
				value = this._input.attr("placeholder") || "";
			}

			if (value === this._mirror.text()) {
				// Nothing have changed - skip
				return;
			}

			// Update mirror
			this._mirror.text(value);
			// Calculate the width
			var newWidth = this._mirror.width() + this._options.space;
			// Update the width
			this._input.width(newWidth);
		}
	}

	export class AutosizeInputOptions implements IAutosizeInputOptions {
		private _space: number;

		constructor(space: number = 30) {
			this._space = space;
		}

		public get space(): number {
			return this._space;
		}
		public set space(value: number) {
			this._space = value;
		}
	}



	(function ($) {
		var pluginDataAttributeName = "autosize-input";
		var validTypes = ["text", "password", "search", "url", "tel", "email", "number"];

		// jQuery Plugin
		$.fn.autosizeInput = function (options?: IAutosizeInputOptions) {
			return this.each(function () {
				// Make sure it is only applied to input elements of valid type
				// Let it be the responsibility of the programmer to only select and apply to valid elements?
				if (!(this.tagName == "INPUT" && $.inArray(this.type, validTypes) > -1)) {
					// Skip - if not input and of valid type
					return;
				}

				var $this = $(this);

				if (!$this.data(Plugins.AutosizeInput.instanceKey)) {
					// If instance not already created and attached

					if (options == undefined) {
						// Try get options from attribute
						options = $this.data(pluginDataAttributeName);

						if (!(options && typeof options == 'object')) {
							// If not object set to default options
							options = new AutosizeInputOptions();
						}
					}

					// Create and attach instance
					$this.data(Plugins.AutosizeInput.instanceKey, new Plugins.AutosizeInput(this, options));
				}
			});
		};

		// On Document Ready
		$(function () {
			// Instantiate for all with data-provide=autosize-input attribute

			// Could limit by attribute here instead of having check in plugin
			// input[type="text"], input[type="password"], input[type="search"], input[type="url"], input[type="tel"], input[type="email"]

			$("input[data-" + pluginDataAttributeName + "]").autosizeInput();
		});

		// Alternative to use On Document Ready and creating the instance immediately
		//$(document).on('focus.autosize-input', 'input[data-autosize-input]', function (e)
		//{
		//	$(this).autosizeInput();
		//});

	})(jQuery);
}