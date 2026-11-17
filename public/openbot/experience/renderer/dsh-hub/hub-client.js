window.__ModuleLoader__.load({
  id: "@dsh-fish/hub",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    //#region rolldown:runtime
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __copyProps = (to, from, except, desc) => {
    	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
    		key = keys[i];
    		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
    			get: ((k) => from[k]).bind(null, key),
    			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    		});
    	}
    	return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
    	value: mod,
    	enumerable: true
    }) : target, mod));

    //#endregion
    let react = require("react");
    react = __toESM(react);
    let react_jsx_runtime = require("react/jsx-runtime");
    react_jsx_runtime = __toESM(react_jsx_runtime);

    //#region src/client/api.ts
    /**
    * The browser half's only way to reach the hub.
    *
    * Every call is same-origin against the host routes: catalog reads are proxied
    * so a WebView restricted to loopback can still browse, and writes go to the
    * host because that is where the installer and the account token live.
    */
    const API = "/api/dsh-fish";
    /** Carries the host's failure code so the UI can react to a refusal by name. */
    var ApiError = class extends Error {
    	constructor(message, code) {
    		super(message);
    		this.code = code;
    		this.name = "ApiError";
    	}
    };
    async function request(path, body) {
    	const response = await fetch(`${API}${path}`, {
    		method: body === void 0 ? "GET" : "POST",
    		headers: body === void 0 ? void 0 : { "content-type": "application/json" },
    		body: body === void 0 ? void 0 : JSON.stringify(body)
    	});
    	const value = await response.json();
    	if (!response.ok) throw new ApiError(value.error ?? `HTTP ${response.status}`, value.code);
    	return value;
    }
    function catalogQuery(query, kind, locale) {
    	const params = new URLSearchParams();
    	if (query.trim() !== "") params.set("q", query.trim());
    	if (kind !== "") params.set("kind", kind);
    	if (locale !== void 0 && locale.trim() !== "") params.set("locale", locale.trim());
    	const suffix = params.toString();
    	return suffix === "" ? "/catalog" : `/catalog?${suffix}`;
    }
    function detailQuery(artifactId, locale) {
    	const params = new URLSearchParams({ artifactId });
    	if (locale !== void 0 && locale.trim() !== "") params.set("locale", locale.trim());
    	return `/detail?${params.toString()}`;
    }

    //#endregion
    //#region src/client/Icons.tsx
    function SpinnerIcon({ className, size = 14,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2.5",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		className: className ? `dshFish__spin ${className}` : "dshFish__spin",
    		"aria-hidden": "true",
    		...props,
    		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })
    	});
    }
    function DownloadIcon({ size = 14,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		"aria-hidden": "true",
    		...props,
    		children: [
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", { points: "7 10 12 15 17 10" }),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
    				x1: "12",
    				y1: "15",
    				x2: "12",
    				y2: "3"
    			})
    		]
    	});
    }
    function TrashIcon({ size = 14,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		"aria-hidden": "true",
    		...props,
    		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", { points: "3 6 5 6 21 6" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })]
    	});
    }
    function VerifiedIcon({ size = 14,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		"aria-hidden": "true",
    		...props,
    		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", { points: "9 12 11 14 15 10" })]
    	});
    }
    function ExternalLinkIcon({ size = 12,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		"aria-hidden": "true",
    		...props,
    		children: [
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", { points: "15 3 21 3 21 9" }),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
    				x1: "10",
    				y1: "14",
    				x2: "21",
    				y2: "3"
    			})
    		]
    	});
    }
    function CloseIcon({ size = 16,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		"aria-hidden": "true",
    		...props,
    		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
    			x1: "18",
    			y1: "6",
    			x2: "6",
    			y2: "18"
    		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
    			x1: "6",
    			y1: "6",
    			x2: "18",
    			y2: "18"
    		})]
    	});
    }
    function UserIcon({ size = 18,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		"aria-hidden": "true",
    		...props,
    		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
    			cx: "12",
    			cy: "7",
    			r: "4"
    		})]
    	});
    }
    /**
    * The dsh.fish mark shown in the left rail.
    *
    * It sits beside the harness's own Plugins icon, so it must not read as a
    * second copy of it: a storefront awning says "catalog" rather than "the
    * things I already have".
    */
    function StorefrontIcon({ size = 18,...props }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
    		width: size,
    		height: size,
    		viewBox: "0 0 24 24",
    		fill: "none",
    		stroke: "currentColor",
    		strokeWidth: "2",
    		strokeLinecap: "round",
    		strokeLinejoin: "round",
    		"aria-hidden": "true",
    		...props,
    		children: [
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 9l1.5-5h15L21 9" }),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" }),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 12v8h14v-8" }),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 20v-5h6v5" })
    		]
    	});
    }

    //#endregion
    //#region src/client/Avatar.tsx
    function Avatar({ src, name, size = 36, className = "", alt }) {
    	const [errored, setErrored] = (0, react.useState)(false);
    	const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : "";
    	const hasImage = Boolean(src && !errored);
    	const accessibleAlt = alt ?? (name ? `${name}'s avatar` : "User avatar");
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    		className: `dshFish__avatar ${className}`,
    		style: {
    			width: size,
    			height: size,
    			minWidth: size,
    			minHeight: size
    		},
    		"aria-label": accessibleAlt,
    		children: hasImage ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
    			src: src ?? void 0,
    			alt: accessibleAlt,
    			className: "dshFish__avatarImg",
    			onError: () => {
    				setErrored(true);
    			}
    		}) : initial ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    			className: "dshFish__avatarInitial",
    			"aria-hidden": "true",
    			children: initial
    		}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UserIcon, { size: Math.round(size * .55) })
    	});
    }

    //#endregion
    //#region src/client/Tooltip.tsx
    function Tooltip({ content, children, position = "top", className = "" }) {
    	const tooltipId = (0, react.useId)();
    	const [visible, setVisible] = (0, react.useState)(false);
    	if (!content) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children });
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
    		className: `dshFish__tooltipWrapper ${className}`,
    		onMouseEnter: () => {
    			setVisible(true);
    		},
    		onMouseLeave: () => {
    			setVisible(false);
    		},
    		onFocus: () => {
    			setVisible(true);
    		},
    		onBlur: () => {
    			setVisible(false);
    		},
    		"aria-describedby": visible ? tooltipId : void 0,
    		children: [children, visible && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    			id: tooltipId,
    			role: "tooltip",
    			className: `dshFish__tooltip dshFish__tooltip--${position}`,
    			children: content
    		})]
    	});
    }

    //#endregion
    //#region src/client/AccountTab.tsx
    const POLL_INTERVAL_MS = 3e3;
    /**
    * Sign-in, by device flow, and plugin maintenance.
    */
    function AccountTab({ t }) {
    	const [account, setAccount] = (0, react.useState)(void 0);
    	const [version, setVersion] = (0, react.useState)(void 0);
    	const [login, setLogin] = (0, react.useState)(void 0);
    	const [starting, setStarting] = (0, react.useState)(false);
    	const [loggingOut, setLoggingOut] = (0, react.useState)(false);
    	const [error, setError] = (0, react.useState)(void 0);
    	const [checkingUpdate, setCheckingUpdate] = (0, react.useState)(false);
    	const [updateResult, setUpdateResult] = (0, react.useState)(void 0);
    	const [updating, setUpdating] = (0, react.useState)(false);
    	const [updateNotice, setUpdateNotice] = (0, react.useState)(void 0);
    	const timer = (0, react.useRef)(void 0);
    	const reload = () => {
    		request("/state").then((state) => {
    			setAccount(state.account);
    			if (state.version) setVersion(state.version);
    			if (state.account.signedIn) {
    				setLogin(void 0);
    				setError(void 0);
    				return;
    			}
    			if (state.account.error !== void 0) {
    				setLogin(void 0);
    				setError(state.account.error);
    			}
    		}, (failure) => {
    			setError(describe$2(failure, t));
    		});
    	};
    	(0, react.useEffect)(() => {
    		reload();
    	}, []);
    	(0, react.useEffect)(() => {
    		if (login === void 0 || account?.signedIn === true) return;
    		timer.current = setInterval(reload, POLL_INTERVAL_MS);
    		return () => {
    			clearInterval(timer.current);
    		};
    	}, [login, account?.signedIn]);
    	const handleLogout = () => {
    		setLoggingOut(true);
    		request("/account/logout", {}).then(() => {
    			setLoggingOut(false);
    			setLogin(void 0);
    			reload();
    		}, (failure) => {
    			setLoggingOut(false);
    			setError(describe$2(failure, t));
    		});
    	};
    	const handleLogin = () => {
    		setStarting(true);
    		setError(void 0);
    		request("/account/login", {}).then((started) => {
    			setStarting(false);
    			setLogin(started);
    		}, (failure) => {
    			setStarting(false);
    			setError(describe$2(failure, t));
    		});
    	};
    	const handleCheckUpdate = () => {
    		setCheckingUpdate(true);
    		setUpdateNotice(void 0);
    		request("/check-update").then((res) => {
    			setCheckingUpdate(false);
    			setUpdateResult(res);
    			if (!res.hasUpdate) setUpdateNotice(t("update.upToDate", { version: res.currentVersion }));
    		}, () => {
    			setCheckingUpdate(false);
    			setUpdateNotice(t("update.failed"));
    		});
    	};
    	const handleApplyUpdate = () => {
    		setUpdating(true);
    		request("/self-update", {}).then(() => {
    			setUpdating(false);
    			setUpdateResult(void 0);
    			setUpdateNotice(t("update.success"));
    		}, () => {
    			setUpdating(false);
    			setUpdateNotice(t("update.failed"));
    		});
    	};
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    		className: "dshFish__panelBody",
    		children: [
    			error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__error",
    				role: "alert",
    				children: error
    			}),
    			account?.signedIn === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    				className: "dshFish__accountCard",
    				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					className: "dshFish__accountInfo",
    					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
    						content: t("account.tooltip", { name: account.displayName ?? "" }),
    						position: "bottom",
    						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    							className: "dshFish__avatarTrigger",
    							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Avatar, {
    								src: account.avatarUrl,
    								name: account.displayName,
    								size: 46,
    								alt: t("account.avatar", { name: account.displayName ?? "" })
    							})
    						})
    					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__accountText",
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    							className: "dshFish__accountName",
    							children: account.displayName
    						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    							className: "dshFish__accountSub",
    							children: t("account.connected")
    						})]
    					})]
    				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    					className: "dshFish__buttonQuiet dshFish__button--destructive",
    					type: "button",
    					disabled: loggingOut,
    					onClick: handleLogout,
    					children: [loggingOut && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("account.logout") })]
    				})]
    			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    				className: "dshFish__signedOut",
    				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    					className: "dshFish__intro",
    					children: t("account.signedOut")
    				}), login === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    					className: "dshFish__button dshFish__button--primary",
    					type: "button",
    					disabled: starting,
    					onClick: handleLogin,
    					children: [starting && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: starting ? t("account.starting") : t("account.login") })]
    				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					className: "dshFish__device",
    					children: [
    						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    							className: "dshFish__code",
    							children: t("account.code", { code: login.userCode })
    						}),
    						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
    							className: "dshFish__link dshFish__link--source",
    							href: login.verificationUrl,
    							target: "_blank",
    							rel: "noreferrer noopener",
    							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("account.open") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ExternalLinkIcon, { size: 12 })]
    						}),
    						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    							className: "dshFish__waitingRow",
    							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    								className: "dshFish__meta",
    								role: "status",
    								children: t("account.waiting")
    							})]
    						})
    					]
    				})]
    			}),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    				className: "dshFish__pluginSection",
    				children: [
    					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
    						className: "dshFish__sectionTitle",
    						children: t("plugin.about")
    					}),
    					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__pluginCard",
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    							className: "dshFish__pluginInfo",
    							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__pluginName",
    								children: "@dsh-fish/hub"
    							}), version && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__meta",
    								children: t("plugin.version", { version })
    							})]
    						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    							className: "dshFish__pluginActions",
    							children: updateResult?.hasUpdate ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    								className: "dshFish__button dshFish__button--primary",
    								type: "button",
    								disabled: updating,
    								onClick: handleApplyUpdate,
    								children: [updating ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: updating ? t("update.upgrading") : `${t("update.upgrade")} (${updateResult.latestVersion})` })]
    							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    								className: "dshFish__button",
    								type: "button",
    								disabled: checkingUpdate,
    								onClick: handleCheckUpdate,
    								children: [checkingUpdate ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: checkingUpdate ? t("update.checking") : t("update.check") })]
    							})
    						})]
    					}),
    					updateNotice && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    						className: "dshFish__notice",
    						role: "status",
    						children: updateNotice
    					})
    				]
    			})
    		]
    	});
    }
    function describe$2(failure, t) {
    	if (failure instanceof ApiError) return failure.message;
    	return t("error.generic");
    }

    //#endregion
    //#region src/client/locale.ts
    /**
    * Copy for the settings section, in the languages the harness UI ships.
    *
    * These live with the plugin rather than in the website's message catalogs: the
    * section renders inside the harness client and follows the harness locale, and
    * a bundle installed into a profile has no access to the site's build.
    */
    const zh = {
    	nav: "dsh.fish",
    	intro: "从 dsh.fish 浏览并安装 harness 构件，写入当前配置档 {profile}。",
    	"tabs.aria": "dsh.fish 插件站",
    	"tab.browse": "浏览",
    	"tab.installed": "已安装",
    	"tab.account": "账号",
    	"search.label": "搜索构件",
    	"search.placeholder": "例如 postgres、代码审查",
    	"search.submit": "搜索",
    	"kind.all": "全部类型",
    	"kind.bundle": "Bundle",
    	"kind.profile": "Profile",
    	"kind.skill": "Skill",
    	"kind.agent-preset": "Agent 预设",
    	"browse.empty": "没有匹配的构件。",
    	"browse.verified": "已验证",
    	"browse.deprecated": "已弃用",
    	"browse.installs": "{count} 次安装",
    	"browse.source": "查看源码",
    	"browse.plan": "查看安装计划",
    	"browse.install": "安装",
    	"browse.installing": "正在安装…",
    	"browse.uninstall": "卸载",
    	"browse.uninstalling": "正在卸载…",
    	"browse.installed": "已安装",
    	"browse.viewDetails": "查看文档详情",
    	"modal.close": "关闭",
    	"modal.documentation": "说明文档",
    	"modal.loading": "正在加载文档…",
    	"modal.noReadme": "该构件暂无说明文档。",
    	"modal.translated": "AI 翻译",
    	"modal.source": "查看源仓库",
    	"modal.author": "作者：{name}",
    	"modal.license": "协议：{license}",
    	"plan.title": "{artifact} 的安装计划",
    	"plan.commands": "将要执行",
    	"plan.warnings": "注意",
    	"plan.buildRefused": "这个包会在安装时从源码构建，也就是在智能体沙箱之外运行它自己的代码。只有你信任来源时才继续。",
    	"plan.allowBuild": "允许构建脚本并安装",
    	"plan.confirm": "安装",
    	"plan.cancel": "取消",
    	"installed.empty": "这个配置档还没有通过 dsh.fish 安装任何构件。",
    	"installed.at": "安装于 {date}",
    	"installed.remove": "卸载",
    	"installed.removing": "正在卸载…",
    	"account.signedOut": "未登录。登录后可以评分，并访问需要账号的构件。",
    	"account.signedIn": "已登录：{name}",
    	"account.tooltip": "已登录 {name}（dsh.fish 账号）",
    	"account.avatar": "{name} 的头像",
    	"account.guest": "访客",
    	"account.status": "账号状态",
    	"account.connected": "已连接 dsh.fish 账号",
    	"account.login": "登录",
    	"account.logout": "退出登录",
    	"account.starting": "正在获取设备码…",
    	"account.code": "在浏览器中输入这个代码：{code}",
    	"account.open": "打开验证页面",
    	"account.waiting": "等待你在浏览器中批准…",
    	"restart.required": "重启 DSH 后生效。",
    	"error.generic": "操作失败，请重试。",
    	"update.check": "检查更新",
    	"update.checking": "正在检查…",
    	"update.upToDate": "已是最新版本 ({version})",
    	"update.available": "发现新版本：v{version}",
    	"update.upgrade": "立即更新",
    	"update.upgrading": "正在更新…",
    	"update.success": "更新成功，重启 DSH 后生效。",
    	"update.failed": "检查或更新失败，请重试。",
    	"plugin.about": "关于插件",
    	"plugin.version": "版本 v{version}",
    	"panel.label": "dsh.fish",
    	"market.title": "dsh.fish 市场",
    	"market.subtitle": "浏览并安装 harness 构件，写入当前配置档 {profile}。",
    	"market.tab.browse": "浏览",
    	"market.tab.installed": "已安装",
    	"market.tab.account": "账号",
    	"market.browse.title": "发现构件",
    	"market.browse.subtitle": "来自 dsh.fish 的 bundle、profile、skill 与 agent 预设。",
    	"market.installed.title": "已安装",
    	"market.installed.subtitle": "通过 dsh.fish 装进这个配置档的构件。",
    	"market.account.title": "账号",
    	"market.account.subtitle": "dsh.fish 账号、评分与更新。",
    	"market.close": "返回对话"
    };
    const en = {
    	nav: "dsh.fish",
    	intro: "Browse and install harness artifacts from dsh.fish into profile {profile}.",
    	"tabs.aria": "dsh.fish plugin station",
    	"tab.browse": "Browse",
    	"tab.installed": "Installed",
    	"tab.account": "Account",
    	"search.label": "Search artifacts",
    	"search.placeholder": "e.g. postgres, code review",
    	"search.submit": "Search",
    	"kind.all": "All kinds",
    	"kind.bundle": "Bundle",
    	"kind.profile": "Profile",
    	"kind.skill": "Skill",
    	"kind.agent-preset": "Agent preset",
    	"browse.empty": "No artifact matches.",
    	"browse.verified": "Verified",
    	"browse.deprecated": "Deprecated",
    	"browse.installs": "{count} installs",
    	"browse.source": "View source",
    	"browse.plan": "Show install plan",
    	"browse.install": "Install",
    	"browse.installing": "Installing…",
    	"browse.uninstall": "Uninstall",
    	"browse.uninstalling": "Uninstalling…",
    	"browse.installed": "Installed",
    	"browse.viewDetails": "View documentation",
    	"modal.close": "Close",
    	"modal.documentation": "Documentation",
    	"modal.loading": "Loading documentation…",
    	"modal.noReadme": "No documentation available for this artifact.",
    	"modal.translated": "AI translated",
    	"modal.source": "View source repository",
    	"modal.author": "Author: {name}",
    	"modal.license": "License: {license}",
    	"plan.title": "Install plan for {artifact}",
    	"plan.commands": "What will run",
    	"plan.warnings": "Heads up",
    	"plan.buildRefused": "This package builds from source on install, which runs its own code outside the agent sandbox. Continue only if you trust the source.",
    	"plan.allowBuild": "Allow build scripts and install",
    	"plan.confirm": "Install",
    	"plan.cancel": "Cancel",
    	"installed.empty": "Nothing installed from dsh.fish in this profile yet.",
    	"installed.at": "Installed {date}",
    	"installed.remove": "Uninstall",
    	"installed.removing": "Uninstalling…",
    	"account.signedOut": "Not signed in. Signing in lets you rate artifacts and reach ones that need an account.",
    	"account.signedIn": "Signed in as {name}",
    	"account.tooltip": "Signed in as {name} (dsh.fish account)",
    	"account.avatar": "{name}'s avatar",
    	"account.guest": "Guest",
    	"account.status": "Account status",
    	"account.connected": "Connected dsh.fish account",
    	"account.login": "Sign in",
    	"account.logout": "Sign out",
    	"account.starting": "Requesting a device code…",
    	"account.code": "Enter this code in your browser: {code}",
    	"account.open": "Open the verification page",
    	"account.waiting": "Waiting for you to approve in the browser…",
    	"restart.required": "Restart DSH to load it.",
    	"error.generic": "That did not work. Try again.",
    	"update.check": "Check for updates",
    	"update.checking": "Checking…",
    	"update.upToDate": "Already up to date ({version})",
    	"update.available": "New version: v{version}",
    	"update.upgrade": "Update now",
    	"update.upgrading": "Updating…",
    	"update.success": "Updated successfully. Restart DSH to apply.",
    	"update.failed": "Update check failed. Try again.",
    	"plugin.about": "About plugin",
    	"plugin.version": "Version v{version}",
    	"panel.label": "dsh.fish",
    	"market.title": "dsh.fish market",
    	"market.subtitle": "Browse and install harness artifacts into profile {profile}.",
    	"market.tab.browse": "Discover",
    	"market.tab.installed": "Installed",
    	"market.tab.account": "Account",
    	"market.browse.title": "Discover artifacts",
    	"market.browse.subtitle": "Bundles, profiles, skills and agent presets from dsh.fish.",
    	"market.installed.title": "Installed",
    	"market.installed.subtitle": "Artifacts dsh.fish put into this profile.",
    	"market.account.title": "Account",
    	"market.account.subtitle": "Your dsh.fish account, ratings and updates.",
    	"market.close": "Back to conversation"
    };
    const LOCALE_NS = "settings.dshFish";
    const dictionaries = {
    	zh,
    	en
    };
    function detectLocale() {
    	if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    		const lang = navigator.language;
    		if (lang.toLowerCase().startsWith("zh")) return "zh-CN";
    		return lang;
    	}
    	return "en";
    }

    //#endregion
    //#region src/client/MarkdownView.tsx
    function MarkdownView({ source, docBase, assetBase, className = "" }) {
    	if (!source || source.trim() === "") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: `dshFish__prose ${className}` });
    	const elements = parseMarkdown(source, docBase, assetBase);
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    		className: `dshFish__prose ${className}`,
    		children: elements
    	});
    }
    function resolveUrl(url, base) {
    	const trimmed = url.trim();
    	if (trimmed === "" || trimmed.startsWith("#")) return trimmed;
    	if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    		if (/^(https?:|mailto:|#)/i.test(trimmed)) return trimmed;
    		return "";
    	}
    	if (!base) return trimmed;
    	try {
    		return new URL(trimmed.replace(/^\/+/, ""), base).toString();
    	} catch {
    		return "";
    	}
    }
    /**
    * Parses inline markdown:
    * - Badges / Linked images: [![alt](imgUrl)](linkUrl)
    * - Images: ![alt](imgUrl)
    * - Links: [text](linkUrl)
    * - Autolinks: https://...
    * - Inline code: `code`
    * - Bold: **text** / __text__
    * - Italic: *text* / _text_
    * - Strikethrough: ~~text~~
    * - HTML tags & entities: <br/>, &amp;, &lt;, &gt;, etc.
    */
    function renderInline(text, docBase, assetBase) {
    	const nodes = [];
    	let index = 0;
    	let key = 0;
    	while (index < text.length) {
    		if (text.startsWith("[![", index)) {
    			const altClose = text.indexOf("]", index + 3);
    			if (altClose !== -1 && text[altClose + 1] === "(") {
    				const imgClose = text.indexOf(")", altClose + 2);
    				if (imgClose !== -1 && text.slice(imgClose + 1, imgClose + 3) === "](") {
    					const linkClose = text.indexOf(")", imgClose + 3);
    					if (linkClose !== -1) {
    						const alt = text.slice(index + 3, altClose);
    						const rawImg = text.slice(altClose + 2, imgClose).trim();
    						const rawLink = text.slice(imgClose + 3, linkClose).trim();
    						const resolvedImg = resolveUrl(rawImg, assetBase);
    						const resolvedLink = resolveUrl(rawLink, docBase);
    						if (resolvedImg && /^https?:/i.test(resolvedImg)) {
    							const img = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
    								src: resolvedImg,
    								alt,
    								loading: "lazy",
    								decoding: "async",
    								className: "dshFish__badgeImg"
    							}, key++);
    							if (resolvedLink && /^(https?:|mailto:|#)/i.test(resolvedLink)) nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
    								href: resolvedLink,
    								target: resolvedLink.startsWith("#") ? void 0 : "_blank",
    								rel: resolvedLink.startsWith("#") ? void 0 : "noreferrer noopener nofollow",
    								className: "dshFish__badgeLink",
    								children: img
    							}, key++));
    							else nodes.push(img);
    							index = linkClose + 1;
    							continue;
    						}
    					}
    				}
    			}
    		}
    		if (text.startsWith("![", index)) {
    			const altClose = text.indexOf("]", index + 2);
    			if (altClose !== -1 && text[altClose + 1] === "(") {
    				const srcClose = text.indexOf(")", altClose + 2);
    				if (srcClose !== -1) {
    					const alt = text.slice(index + 2, altClose);
    					const resolvedSrc = resolveUrl(text.slice(altClose + 2, srcClose).trim(), assetBase);
    					if (resolvedSrc && /^https?:/i.test(resolvedSrc)) nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
    						src: resolvedSrc,
    						alt,
    						loading: "lazy",
    						decoding: "async",
    						className: "dshFish__proseImg"
    					}, key++));
    					index = srcClose + 1;
    					continue;
    				}
    			}
    		}
    		if (text[index] === "`") {
    			const end = text.indexOf("`", index + 1);
    			if (end !== -1) {
    				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
    					className: "dshFish__codeInline",
    					children: text.slice(index + 1, end)
    				}, key++));
    				index = end + 1;
    				continue;
    			}
    		}
    		if (text[index] === "[") {
    			const textClose = text.indexOf("]", index + 1);
    			if (textClose !== -1 && text[textClose + 1] === "(") {
    				const urlClose = text.indexOf(")", textClose + 2);
    				if (urlClose !== -1) {
    					const linkText = text.slice(index + 1, textClose);
    					const resolvedUrl = resolveUrl(text.slice(textClose + 2, urlClose).trim(), docBase);
    					if (resolvedUrl && /^(https?:|mailto:|#)/i.test(resolvedUrl)) nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
    						href: resolvedUrl,
    						target: resolvedUrl.startsWith("#") ? void 0 : "_blank",
    						rel: resolvedUrl.startsWith("#") ? void 0 : "noreferrer noopener nofollow",
    						className: "dshFish__link",
    						children: renderInline(linkText, docBase, assetBase)
    					}, key++));
    					else nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: renderInline(linkText, docBase, assetBase) }, key++));
    					index = urlClose + 1;
    					continue;
    				}
    			}
    		}
    		if (text.startsWith("https://", index) || text.startsWith("http://", index)) {
    			const match = text.slice(index).match(/^(https?:\/\/[^\s<>)"]+)/);
    			if (match && match[1]) {
    				const cleanUrl = match[1].replace(/[.,;:)]+$/, "");
    				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
    					href: cleanUrl,
    					target: "_blank",
    					rel: "noreferrer noopener nofollow",
    					className: "dshFish__link",
    					children: cleanUrl
    				}, key++));
    				index += cleanUrl.length;
    				continue;
    			}
    		}
    		if (text.startsWith("**", index) || text.startsWith("__", index)) {
    			const marker = text.slice(index, index + 2);
    			const end = text.indexOf(marker, index + 2);
    			if (end !== -1) {
    				const boldText = text.slice(index + 2, end);
    				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: renderInline(boldText, docBase, assetBase) }, key++));
    				index = end + 2;
    				continue;
    			}
    		}
    		if (text.startsWith("~~", index)) {
    			const end = text.indexOf("~~", index + 2);
    			if (end !== -1) {
    				const strikeText = text.slice(index + 2, end);
    				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("del", { children: renderInline(strikeText, docBase, assetBase) }, key++));
    				index = end + 2;
    				continue;
    			}
    		}
    		const currentChar = text[index];
    		const nextChar = text[index + 1];
    		if ((currentChar === "*" || currentChar === "_") && nextChar !== void 0 && nextChar !== " " && nextChar !== "	" && nextChar !== "\n") {
    			const marker = currentChar;
    			const end = text.indexOf(marker, index + 1);
    			if (end !== -1 && text[end - 1] !== " " && text[end - 1] !== "	") {
    				const italicText = text.slice(index + 1, end);
    				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: renderInline(italicText, docBase, assetBase) }, key++));
    				index = end + 1;
    				continue;
    			}
    		}
    		if (text[index] === "<") {
    			if (/^<br\s*\/?>/i.test(text.slice(index))) {
    				const match = text.slice(index).match(/^<br\s*\/?>/i);
    				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}, key++));
    				index += match ? match[0].length : 4;
    				continue;
    			}
    			if (text.startsWith("<!--", index)) {
    				const commentEnd = text.indexOf("-->", index + 4);
    				if (commentEnd !== -1) {
    					index = commentEnd + 3;
    					continue;
    				}
    			}
    			const imgMatch = text.slice(index).match(/^<img\s+([^>]*)\/?>/i);
    			if (imgMatch && imgMatch[0] && imgMatch[1]) {
    				const attrs = imgMatch[1];
    				const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    				const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
    				if (srcMatch && srcMatch[1]) {
    					const resolvedSrc = resolveUrl(srcMatch[1], assetBase);
    					if (resolvedSrc && /^https?:/i.test(resolvedSrc)) nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
    						src: resolvedSrc,
    						alt: altMatch?.[1] ?? "",
    						loading: "lazy",
    						decoding: "async",
    						className: "dshFish__proseImg"
    					}, key++));
    				}
    				index += imgMatch[0].length;
    				continue;
    			}
    			const genericTag = text.slice(index).match(/^<\/?[a-zA-Z0-9_-]+(?:\s+[^>]*?)?>/);
    			if (genericTag && genericTag[0]) {
    				index += genericTag[0].length;
    				continue;
    			}
    		}
    		let nextSpecial = index + 1;
    		while (nextSpecial < text.length) {
    			const c = text[nextSpecial];
    			if (c === "`" || c === "[" || c === "*" || c === "_" || c === "<" || c === "~" || c === "!" && text[nextSpecial + 1] === "[" || c === "h" && (text.startsWith("https://", nextSpecial) || text.startsWith("http://", nextSpecial))) break;
    			nextSpecial++;
    		}
    		nodes.push(text.slice(index, nextSpecial));
    		index = nextSpecial;
    	}
    	return nodes;
    }
    function parseMarkdown(source, docBase, assetBase) {
    	const lines = source.replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "").split("\n");
    	const blocks = [];
    	let index = 0;
    	let blockKey = 0;
    	while (index < lines.length) {
    		const rawLine = lines[index] ?? "";
    		const trimmed = rawLine.trim();
    		if (trimmed === "") {
    			index++;
    			continue;
    		}
    		if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
    			const marker = trimmed.slice(0, 3);
    			const lang = trimmed.slice(3).trim();
    			const codeLines = [];
    			index++;
    			while (index < lines.length && !lines[index]?.trim().startsWith(marker)) {
    				codeLines.push(lines[index] ?? "");
    				index++;
    			}
    			if (index < lines.length) index++;
    			const code = codeLines.join("\n");
    			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CodeBlock, {
    				code,
    				lang
    			}, blockKey++));
    			continue;
    		}
    		const headingMatch = trimmed.match(/^(#{1,6})(?:\s+(.*?))?(?:\s+#+)?$/);
    		if (headingMatch && headingMatch[1]) {
    			const level = headingMatch[1].length;
    			const headingContent = headingMatch[2]?.trim() ?? "";
    			const Tag = `h${Math.min(6, level + 1)}`;
    			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
    				className: `dshFish__h${level}`,
    				children: renderInline(headingContent, docBase, assetBase)
    			}, blockKey++));
    			index++;
    			continue;
    		}
    		if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(trimmed)) {
    			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { className: "dshFish__hr" }, blockKey++));
    			index++;
    			continue;
    		}
    		if (trimmed.startsWith(">")) {
    			const quoteLines = [];
    			while (index < lines.length && (lines[index]?.trim().startsWith(">") || lines[index]?.trim() !== "" && quoteLines.length > 0 && !lines[index]?.trim().startsWith("#") && !lines[index]?.trim().startsWith("```"))) {
    				const qLine = lines[index]?.trim() ?? "";
    				if (qLine.startsWith(">")) quoteLines.push(qLine.replace(/^>\s?/, ""));
    				else if (qLine === "") break;
    				else quoteLines.push(qLine);
    				index++;
    			}
    			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("blockquote", {
    				className: "dshFish__blockquote",
    				children: renderInline(quoteLines.join(" "), docBase, assetBase)
    			}, blockKey++));
    			continue;
    		}
    		if (/^(\s*)[-*+]\s+(.*)$/.test(rawLine)) {
    			const listItems = [];
    			let itemKey = 0;
    			while (index < lines.length && /^(\s*)[-*+]\s+(.*)$/.test(lines[index] ?? "")) {
    				const match = (lines[index] ?? "").match(/^(\s*)[-*+]\s+(.*)$/);
    				if (match && match[2] !== void 0) {
    					const itemText = match[2];
    					if (itemText.startsWith("[ ] ") || itemText.startsWith("[x] ") || itemText.startsWith("[X] ")) {
    						const isChecked = !itemText.startsWith("[ ] ");
    						const taskContent = itemText.slice(4);
    						listItems.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
    							className: "dshFish__taskItem",
    							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
    								type: "checkbox",
    								checked: isChecked,
    								readOnly: true,
    								className: "dshFish__checkbox"
    							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: renderInline(taskContent, docBase, assetBase) })]
    						}, itemKey++));
    					} else listItems.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: renderInline(itemText, docBase, assetBase) }, itemKey++));
    				}
    				index++;
    			}
    			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
    				className: "dshFish__ul",
    				children: listItems
    			}, blockKey++));
    			continue;
    		}
    		if (/^\s*\d+\.\s+(.*)$/.test(rawLine)) {
    			const listItems = [];
    			let itemKey = 0;
    			while (index < lines.length && /^\s*\d+\.\s+(.*)$/.test(lines[index] ?? "")) {
    				const match = (lines[index] ?? "").match(/^\s*\d+\.\s+(.*)$/);
    				if (match && match[1] !== void 0) listItems.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: renderInline(match[1], docBase, assetBase) }, itemKey++));
    				index++;
    			}
    			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
    				className: "dshFish__ol",
    				children: listItems
    			}, blockKey++));
    			continue;
    		}
    		if (trimmed.includes("|") && index + 1 < lines.length && lines[index + 1]?.includes("|") && lines[index + 1]?.includes("-")) {
    			const tableLines = [];
    			while (index < lines.length && (lines[index]?.trim().includes("|") || lines[index]?.trim().startsWith("|-"))) {
    				tableLines.push(lines[index]?.trim() ?? "");
    				index++;
    			}
    			if (tableLines.length >= 2) {
    				const headerCells = parseTableRow(tableLines[0] ?? "");
    				const rows = tableLines.slice(2).map(parseTableRow);
    				blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    					className: "dshFish__tableWrapper",
    					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
    						className: "dshFish__table",
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", { children: headerCells.map((cell, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: renderInline(cell, docBase, assetBase) }, i)) }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: rows.map((row, r) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", { children: row.map((cell, c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: renderInline(cell, docBase, assetBase) }, c)) }, r)) })]
    					})
    				}, blockKey++));
    				continue;
    			}
    		}
    		const paragraphLines = [];
    		while (index < lines.length && lines[index]?.trim() !== "" && !lines[index]?.trim().startsWith("```") && !lines[index]?.trim().startsWith("~~~") && !lines[index]?.trim().match(/^#{1,6}(\s+|$)/) && !lines[index]?.trim().startsWith(">") && !/^(\s*)[-*+]\s+/.test(lines[index] ?? "") && !/^\s*\d+\.\s+/.test(lines[index] ?? "") && !/^(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[index]?.trim() ?? "")) {
    			paragraphLines.push(lines[index]?.trim() ?? "");
    			index++;
    		}
    		if (paragraphLines.length > 0) blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    			className: "dshFish__p",
    			children: renderInline(paragraphLines.join(" "), docBase, assetBase)
    		}, blockKey++));
    		else {
    			const fallbackLine = lines[index]?.trim() ?? "";
    			if (fallbackLine !== "") blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__p",
    				children: renderInline(fallbackLine, docBase, assetBase)
    			}, blockKey++));
    			index++;
    		}
    	}
    	return blocks;
    }
    function parseTableRow(line) {
    	let cleaned = line.trim();
    	if (cleaned.startsWith("|")) cleaned = cleaned.slice(1);
    	if (cleaned.endsWith("|")) cleaned = cleaned.slice(0, -1);
    	return cleaned.split("|").map((c) => c.trim());
    }
    function CodeBlock({ code, lang }) {
    	const [copied, setCopied] = (0, react.useState)(false);
    	const handleCopy = () => {
    		if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(code).then(() => {
    			setCopied(true);
    			setTimeout(() => {
    				setCopied(false);
    			}, 2e3);
    		});
    	};
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    		className: "dshFish__codeBlock",
    		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    			className: "dshFish__codeBlockHead",
    			children: [lang ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    				className: "dshFish__codeLang",
    				children: lang
    			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
    				type: "button",
    				className: "dshFish__codeCopyBtn",
    				onClick: handleCopy,
    				"aria-label": copied ? "Copied" : "Copy code",
    				children: copied ? "Copied" : "Copy"
    			})]
    		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
    			className: "dshFish__pre",
    			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: code })
    		})]
    	});
    }

    //#endregion
    //#region src/client/ReadmeModal.tsx
    function ReadmeModal({ item, locale, isInstalled, isBusy, onClose, onInstall, onUninstall, t }) {
    	const [detail, setDetail] = (0, react.useState)(void 0);
    	const [loading, setLoading] = (0, react.useState)(false);
    	const [error, setError] = (0, react.useState)(void 0);
    	(0, react.useEffect)(() => {
    		if (!item) {
    			setDetail(void 0);
    			return;
    		}
    		setLoading(true);
    		setError(void 0);
    		request(detailQuery(item.id, locale)).then((result) => {
    			setDetail(result);
    			setLoading(false);
    		}, () => {
    			setError(t("error.generic"));
    			setLoading(false);
    		});
    	}, [
    		item,
    		locale,
    		t
    	]);
    	(0, react.useEffect)(() => {
    		if (!item) return;
    		const handleKeyDown = (event) => {
    			if (event.key === "Escape") onClose();
    		};
    		window.addEventListener("keydown", handleKeyDown);
    		return () => {
    			window.removeEventListener("keydown", handleKeyDown);
    		};
    	}, [item, onClose]);
    	if (!item) return null;
    	const currentDisplayName = detail?.displayName ?? item.displayName;
    	const currentSummary = detail?.summary ?? item.summary;
    	const kindKey = `kind.${item.kind}`;
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    		className: "dshFish__modalOverlay",
    		role: "dialog",
    		"aria-modal": "true",
    		"aria-labelledby": "dsh-fish-modal-title",
    		onClick: (e) => {
    			if (e.target === e.currentTarget) onClose();
    		},
    		children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    			className: "dshFish__modal",
    			children: [
    				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					className: "dshFish__modalHead",
    					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__modalHeadTitle",
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
    							id: "dsh-fish-modal-title",
    							className: "dshFish__modalTitle",
    							children: currentDisplayName
    						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    							className: "dshFish__modalBadges",
    							children: [
    								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    									className: "dshFish__tag dshFish__tag--kind",
    									children: t(kindKey)
    								}),
    								item.verified && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
    									className: "dshFish__tag dshFish__tag--verified",
    									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(VerifiedIcon, { size: 12 }), t("browse.verified")]
    								}),
    								item.deprecated && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    									className: "dshFish__tag dshFish__tag--deprecated",
    									children: t("browse.deprecated")
    								}),
    								detail?.readmeMachineTranslated && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    									className: "dshFish__tag dshFish__tag--ai",
    									children: t("modal.translated")
    								})
    							]
    						})]
    					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__modalHeadActions",
    						children: [isInstalled ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    							type: "button",
    							className: "dshFish__buttonQuiet dshFish__button--destructive",
    							disabled: isBusy,
    							onClick: () => {
    								onUninstall(item);
    							},
    							children: [isBusy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashIcon, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isBusy ? t("browse.uninstalling") : t("browse.uninstall") })]
    						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    							type: "button",
    							className: "dshFish__button dshFish__button--primary",
    							disabled: isBusy,
    							onClick: () => {
    								onInstall(item);
    							},
    							children: [isBusy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DownloadIcon, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isBusy ? t("browse.installing") : t("browse.install") })]
    						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
    							type: "button",
    							className: "dshFish__modalClose",
    							onClick: onClose,
    							"aria-label": t("modal.close"),
    							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CloseIcon, { size: 16 })
    						})]
    					})]
    				}),
    				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					className: "dshFish__modalMeta",
    					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    						className: "dshFish__modalSummary",
    						children: currentSummary
    					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__modalMetaRow",
    						children: [
    							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__meta",
    								children: t("browse.installs", { count: item.installs })
    							}),
    							detail?.author?.name && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__meta",
    								children: t("modal.author", { name: detail.author.name })
    							}),
    							detail?.license && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__meta",
    								children: t("modal.license", { license: detail.license })
    							}),
    							item.sourceUrl && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
    								href: item.sourceUrl,
    								target: "_blank",
    								rel: "noreferrer noopener",
    								className: "dshFish__link dshFish__link--source",
    								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("modal.source") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ExternalLinkIcon, { size: 11 })]
    							})
    						]
    					})]
    				}),
    				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    					className: "dshFish__modalBody",
    					children: loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__modalLoading",
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 20 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("modal.loading") })]
    					}) : error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    						className: "dshFish__error",
    						children: error
    					}) : detail?.readmeMarkdown ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarkdownView, {
    						source: detail.readmeMarkdown,
    						docBase: detail.sourceDocBase,
    						assetBase: detail.sourceAssetBase
    					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    						className: "dshFish__empty",
    						children: t("modal.noReadme")
    					})
    				})
    			]
    		})
    	});
    }

    //#endregion
    //#region src/client/BrowseTab.tsx
    const KINDS = [
    	"bundle",
    	"profile",
    	"skill",
    	"agent-preset"
    ];
    function BrowseTab({ t }) {
    	const [query, setQuery] = (0, react.useState)("");
    	const [kind, setKind] = (0, react.useState)("");
    	const [items, setItems] = (0, react.useState)(void 0);
    	const [installedIds, setInstalledIds] = (0, react.useState)(() => /* @__PURE__ */ new Set());
    	const [busyId, setBusyId] = (0, react.useState)(void 0);
    	const [outcome, setOutcome] = (0, react.useState)(void 0);
    	const [error, setError] = (0, react.useState)(void 0);
    	const [selectedItem, setSelectedItem] = (0, react.useState)(null);
    	const locale = detectLocale();
    	const reloadInstalled = () => {
    		request("/state").then((state) => {
    			setInstalledIds(new Set(state.installed.map((item) => item.artifactId)));
    		}, () => void 0);
    	};
    	const search = (nextKind = kind) => {
    		setError(void 0);
    		request(catalogQuery(query, nextKind, locale)).then((result) => {
    			setItems(result.items);
    		}, (failure) => {
    			setError(describe$1(failure, t));
    		});
    	};
    	(0, react.useEffect)(() => {
    		search();
    		reloadInstalled();
    	}, []);
    	const install = (item) => {
    		setBusyId(item.id);
    		setError(void 0);
    		setOutcome(void 0);
    		request("/install", {
    			artifactId: item.id,
    			allowBuildScripts: true
    		}).then((result) => {
    			setBusyId(void 0);
    			setOutcome(result);
    			setInstalledIds((prev) => new Set([...prev, item.id]));
    			reloadInstalled();
    		}, (failure) => {
    			setBusyId(void 0);
    			setError(describe$1(failure, t));
    		});
    	};
    	const uninstall = (item) => {
    		setBusyId(item.id);
    		setError(void 0);
    		setOutcome(void 0);
    		request("/remove", { artifactId: item.id }).then((result) => {
    			setBusyId(void 0);
    			setOutcome(result);
    			setInstalledIds((prev) => {
    				const next = new Set(prev);
    				next.delete(item.id);
    				return next;
    			});
    			reloadInstalled();
    		}, (failure) => {
    			setBusyId(void 0);
    			setError(describe$1(failure, t));
    		});
    	};
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    		className: "dshFish__panelBody",
    		children: [
    			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
    				className: "dshFish__search",
    				onSubmit: (event) => {
    					event.preventDefault();
    					search();
    				},
    				children: [
    					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
    						className: "dshFish__srOnly",
    						htmlFor: "dsh-fish-search",
    						children: t("search.label")
    					}),
    					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
    						id: "dsh-fish-search",
    						className: "dshFish__input",
    						type: "search",
    						value: query,
    						placeholder: t("search.placeholder"),
    						onChange: (event) => {
    							setQuery(event.target.value);
    						}
    					}),
    					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
    						className: "dshFish__select",
    						value: kind,
    						"aria-label": t("kind.all"),
    						onChange: (event) => {
    							setKind(event.target.value);
    							search(event.target.value);
    						},
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
    							value: "",
    							children: t("kind.all")
    						}), KINDS.map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
    							value,
    							children: t(`kind.${value}`)
    						}, value))]
    					}),
    					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
    						className: "dshFish__button",
    						type: "submit",
    						children: t("search.submit")
    					})
    				]
    			}),
    			error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__error",
    				role: "alert",
    				children: error
    			}),
    			outcome !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__notice",
    				role: "status",
    				children: outcome.restartRequired ? t("restart.required") : ""
    			}),
    			items !== void 0 && items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__empty",
    				children: t("browse.empty")
    			}),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
    				className: "dshFish__list",
    				children: (items ?? []).map((item) => {
    					const isInstalled = installedIds.has(item.id);
    					const isBusy = busyId === item.id;
    					const kindKey = `kind.${item.kind}`;
    					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
    						className: "dshFish__card dshFish__card--clickable",
    						tabIndex: 0,
    						role: "button",
    						"aria-label": item.displayName,
    						onClick: () => {
    							setSelectedItem(item);
    						},
    						onKeyDown: (e) => {
    							if (e.key === "Enter" || e.key === " ") {
    								if (e.target === e.currentTarget) {
    									e.preventDefault();
    									setSelectedItem(item);
    								}
    							}
    						},
    						children: [
    							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    								className: "dshFish__cardHead",
    								children: [
    									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    										className: "dshFish__cardName",
    										children: item.displayName
    									}),
    									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    										className: "dshFish__tag dshFish__tag--kind",
    										children: t(kindKey)
    									}),
    									item.verified && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
    										className: "dshFish__tag dshFish__tag--verified",
    										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(VerifiedIcon, { size: 12 }), t("browse.verified")]
    									}),
    									item.deprecated && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    										className: "dshFish__tag dshFish__tag--deprecated",
    										children: t("browse.deprecated")
    									})
    								]
    							}),
    							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    								className: "dshFish__cardSummary",
    								children: item.summary
    							}),
    							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    								className: "dshFish__cardFoot",
    								children: [
    									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    										className: "dshFish__meta",
    										children: t("browse.installs", { count: item.installs })
    									}),
    									item.sourceUrl && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
    										className: "dshFish__link dshFish__link--source",
    										href: item.sourceUrl,
    										target: "_blank",
    										rel: "noreferrer noopener",
    										onClick: (e) => {
    											e.stopPropagation();
    										},
    										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("browse.source") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ExternalLinkIcon, { size: 11 })]
    									}),
    									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    										className: "dshFish__cardActions",
    										children: isInstalled ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    											className: "dshFish__buttonQuiet dshFish__button--destructive",
    											type: "button",
    											disabled: busyId !== void 0,
    											onClick: (e) => {
    												e.stopPropagation();
    												uninstall(item);
    											},
    											children: [isBusy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashIcon, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isBusy ? t("browse.uninstalling") : t("browse.uninstall") })]
    										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    											className: "dshFish__button dshFish__button--primary",
    											type: "button",
    											disabled: busyId !== void 0,
    											onClick: (e) => {
    												e.stopPropagation();
    												install(item);
    											},
    											children: [isBusy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DownloadIcon, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isBusy ? t("browse.installing") : t("browse.install") })]
    										})
    									})
    								]
    							})
    						]
    					}, item.id);
    				})
    			}),
    			selectedItem !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReadmeModal, {
    				item: selectedItem,
    				locale,
    				isInstalled: installedIds.has(selectedItem.id),
    				isBusy: busyId === selectedItem.id,
    				onClose: () => {
    					setSelectedItem(null);
    				},
    				onInstall: install,
    				onUninstall: uninstall,
    				t
    			})
    		]
    	});
    }
    function describe$1(failure, t) {
    	if (failure instanceof ApiError) return failure.message;
    	return t("error.generic");
    }

    //#endregion
    //#region src/client/InstalledTab.tsx
    /**
    * What this profile installed from the hub.
    *
    * The list is the host's lockfile, the same record `hub_list` and
    * `@dsh-fish/cli list` read — so an artifact an agent installed mid-session
    * shows up here, and one removed here disappears from the tools.
    */
    function InstalledTab({ t }) {
    	const [items, setItems] = (0, react.useState)(void 0);
    	const [busyId, setBusyId] = (0, react.useState)(void 0);
    	const [restartRequired, setRestartRequired] = (0, react.useState)(false);
    	const [error, setError] = (0, react.useState)(void 0);
    	const [selectedItem, setSelectedItem] = (0, react.useState)(null);
    	const locale = detectLocale();
    	const reload = () => {
    		request("/state").then((state) => {
    			setItems(state.installed);
    		}, (failure) => {
    			setError(describe(failure, t));
    		});
    	};
    	(0, react.useEffect)(() => {
    		reload();
    	}, []);
    	const handleUninstall = (item) => {
    		const artifactId = "id" in item ? item.id : item.artifactId;
    		setBusyId(artifactId);
    		setError(void 0);
    		request("/remove", { artifactId }).then((outcome) => {
    			setBusyId(void 0);
    			setRestartRequired(outcome.restartRequired);
    			if (selectedItem?.id === artifactId) setSelectedItem(null);
    			reload();
    		}, (failure) => {
    			setBusyId(void 0);
    			setError(describe(failure, t));
    		});
    	};
    	const handleInstall = (item) => {
    		setBusyId(item.id);
    		setError(void 0);
    		request("/install", {
    			artifactId: item.id,
    			allowBuildScripts: true
    		}).then((outcome) => {
    			setBusyId(void 0);
    			setRestartRequired(outcome.restartRequired);
    			reload();
    		}, (failure) => {
    			setBusyId(void 0);
    			setError(describe(failure, t));
    		});
    	};
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    		className: "dshFish__panelBody",
    		children: [
    			error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__error",
    				role: "alert",
    				children: error
    			}),
    			restartRequired && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__notice",
    				role: "status",
    				children: t("restart.required")
    			}),
    			items !== void 0 && items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    				className: "dshFish__empty",
    				children: t("installed.empty")
    			}),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
    				className: "dshFish__list",
    				children: (items ?? []).map((item) => {
    					const isBusy = busyId === item.artifactId;
    					const kindKey = `kind.${item.kind}`;
    					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
    						className: "dshFish__card dshFish__card--clickable",
    						tabIndex: 0,
    						role: "button",
    						"aria-label": item.artifactId,
    						onClick: () => {
    							setSelectedItem({
    								id: item.artifactId,
    								kind: item.kind,
    								displayName: item.artifactId,
    								summary: "",
    								verified: false,
    								deprecated: false,
    								installs: 0,
    								sourceUrl: ""
    							});
    						},
    						onKeyDown: (e) => {
    							if (e.key === "Enter" || e.key === " ") {
    								if (e.target === e.currentTarget) {
    									e.preventDefault();
    									setSelectedItem({
    										id: item.artifactId,
    										kind: item.kind,
    										displayName: item.artifactId,
    										summary: "",
    										verified: false,
    										deprecated: false,
    										installs: 0,
    										sourceUrl: ""
    									});
    								}
    							}
    						},
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    							className: "dshFish__cardHead",
    							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__cardName",
    								children: item.artifactId
    							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__tag dshFish__tag--kind",
    								children: t(kindKey)
    							})]
    						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    							className: "dshFish__cardFoot",
    							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    								className: "dshFish__meta",
    								children: t("installed.at", { date: new Date(item.installedAt).toLocaleDateString() })
    							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    								className: "dshFish__cardActions",
    								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    									className: "dshFish__buttonQuiet dshFish__button--destructive",
    									type: "button",
    									disabled: busyId !== void 0,
    									onClick: (e) => {
    										e.stopPropagation();
    										handleUninstall(item);
    									},
    									children: [isBusy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 13 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashIcon, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isBusy ? t("installed.removing") : t("installed.remove") })]
    								})
    							})]
    						})]
    					}, item.artifactId);
    				})
    			}),
    			selectedItem !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReadmeModal, {
    				item: selectedItem,
    				locale,
    				isInstalled: true,
    				isBusy: busyId === selectedItem.id,
    				onClose: () => {
    					setSelectedItem(null);
    				},
    				onInstall: handleInstall,
    				onUninstall: handleUninstall,
    				t
    			})
    		]
    	});
    }
    function describe(failure, t) {
    	if (failure instanceof ApiError) return failure.message;
    	return t("error.generic");
    }

    //#endregion
    //#region src/client/HubSection.tsx
    const TABS = [
    	{
    		id: "browse",
    		label: "tab.browse"
    	},
    	{
    		id: "installed",
    		label: "tab.installed"
    	},
    	{
    		id: "account",
    		label: "tab.account"
    	}
    ];
    function HubSection({ t }) {
    	const tabsId = (0, react.useId)();
    	const tabRefs = (0, react.useRef)([]);
    	const [activeId, setActiveId] = (0, react.useState)("browse");
    	const [visitedIds, setVisitedIds] = (0, react.useState)(() => new Set(["browse"]));
    	const [profile, setProfile] = (0, react.useState)(void 0);
    	const [version, setVersion] = (0, react.useState)(void 0);
    	const [checkingUpdate, setCheckingUpdate] = (0, react.useState)(false);
    	const [updateResult, setUpdateResult] = (0, react.useState)(void 0);
    	const [updating, setUpdating] = (0, react.useState)(false);
    	const [updateNotice, setUpdateNotice] = (0, react.useState)(void 0);
    	(0, react.useEffect)(() => {
    		request("/state").then((state) => {
    			setProfile(state.profile);
    			if (state.version) setVersion(state.version);
    		}, () => void 0);
    	}, []);
    	(0, react.useEffect)(() => {
    		setVisitedIds((previous) => {
    			if (previous.has(activeId)) return previous;
    			return new Set([...previous, activeId]);
    		});
    	}, [activeId]);
    	const checkForUpdate = () => {
    		setCheckingUpdate(true);
    		setUpdateNotice(void 0);
    		request("/check-update").then((res) => {
    			setCheckingUpdate(false);
    			setUpdateResult(res);
    			if (!res.hasUpdate) setUpdateNotice(t("update.upToDate", { version: res.currentVersion }));
    		}, () => {
    			setCheckingUpdate(false);
    			setUpdateNotice(t("update.failed"));
    		});
    	};
    	const applyUpdate = () => {
    		setUpdating(true);
    		request("/self-update", {}).then(() => {
    			setUpdating(false);
    			setUpdateResult(void 0);
    			setUpdateNotice(t("update.success"));
    		}, () => {
    			setUpdating(false);
    			setUpdateNotice(t("update.failed"));
    		});
    	};
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
    		className: "dshFish",
    		children: [
    			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    				className: "dshFish__header",
    				children: [
    					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__headerTitleRow",
    						children: [
    							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
    								className: "dshFish__heading",
    								children: "dsh.fish"
    							}),
    							version && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
    								className: "dshFish__versionBadge",
    								children: ["v", version]
    							}),
    							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
    								className: "dshFish__checkUpdateBtn",
    								type: "button",
    								disabled: checkingUpdate || updating,
    								onClick: checkForUpdate,
    								children: checkingUpdate ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 12 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("update.checking") })] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("update.check") })
    							})
    						]
    					}),
    					profile !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    						className: "dshFish__intro",
    						children: t("intro", { profile })
    					}),
    					updateResult?.hasUpdate && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFish__updateBanner",
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("update.available", { version: updateResult.latestVersion }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
    							className: "dshFish__button dshFish__button--primary dshFish__button--sm",
    							type: "button",
    							disabled: updating,
    							onClick: applyUpdate,
    							children: [updating && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpinnerIcon, { size: 12 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: updating ? t("update.upgrading") : t("update.upgrade") })]
    						})]
    					}),
    					updateNotice && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    						className: "dshFish__notice",
    						role: "status",
    						children: updateNotice
    					})
    				]
    			}),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    				className: "dshFish__tabs",
    				role: "tablist",
    				"aria-label": t("tabs.aria"),
    				children: TABS.map((tab, index) => {
    					const selected = tab.id === activeId;
    					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
    						ref: (element) => {
    							tabRefs.current[index] = element;
    						},
    						id: `${tabsId}-tab-${tab.id}`,
    						type: "button",
    						role: "tab",
    						className: "dshFish__tab",
    						"aria-selected": selected,
    						"aria-controls": `${tabsId}-panel-${tab.id}`,
    						"data-active": selected ? "true" : void 0,
    						tabIndex: selected ? 0 : -1,
    						onClick: () => {
    							setActiveId(tab.id);
    						},
    						onKeyDown: (event) => {
    							let nextIndex;
    							switch (event.key) {
    								case "ArrowRight":
    									nextIndex = (index + 1) % TABS.length;
    									break;
    								case "ArrowLeft":
    									nextIndex = (index - 1 + TABS.length) % TABS.length;
    									break;
    								case "Home":
    									nextIndex = 0;
    									break;
    								case "End":
    									nextIndex = TABS.length - 1;
    									break;
    								default: return;
    							}
    							event.preventDefault();
    							const nextTab = TABS[nextIndex];
    							if (nextTab === void 0) return;
    							setActiveId(nextTab.id);
    							tabRefs.current[nextIndex]?.focus();
    						},
    						children: t(tab.label)
    					}, tab.id);
    				})
    			}),
    			TABS.filter((tab) => tab.id === activeId || visitedIds.has(tab.id)).map((tab) => {
    				const selected = tab.id === activeId;
    				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					id: `${tabsId}-panel-${tab.id}`,
    					className: "dshFish__panel",
    					role: "tabpanel",
    					"aria-labelledby": `${tabsId}-tab-${tab.id}`,
    					hidden: !selected,
    					children: [
    						tab.id === "browse" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BrowseTab, { t }),
    						tab.id === "installed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstalledTab, { t }),
    						tab.id === "account" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountTab, { t })
    					]
    				}, tab.id);
    			})
    		]
    	});
    }

    //#endregion
    //#region src/client/MarketPage.tsx
    const TAB_IDS = [
    	"browse",
    	"installed",
    	"account"
    ];
    /**
    * Render the market: tab bar, page header, and the selected panel.
    *
    * @param props - the translate function and an optional close affordance.
    * @returns the market page.
    */
    function MarketPage({ t, onClose }) {
    	const tabsId = (0, react.useId)();
    	const tabRefs = (0, react.useRef)([]);
    	const [activeId, setActiveId] = (0, react.useState)("browse");
    	const [visitedIds, setVisitedIds] = (0, react.useState)(() => new Set(["browse"]));
    	const [profile, setProfile] = (0, react.useState)(void 0);
    	(0, react.useEffect)(() => {
    		request("/state").then((state) => {
    			setProfile(state.profile);
    		}, () => void 0);
    	}, []);
    	(0, react.useEffect)(() => {
    		setVisitedIds((previous) => {
    			if (previous.has(activeId)) return previous;
    			return new Set([...previous, activeId]);
    		});
    	}, [activeId]);
    	const selectTab = (0, react.useCallback)((next) => {
    		setActiveId(next);
    	}, []);
    	const onTabKeyDown = (0, react.useCallback)((event) => {
    		const index = TAB_IDS.indexOf(activeId);
    		let nextIndex;
    		if (event.key === "ArrowRight") nextIndex = (index + 1) % TAB_IDS.length;
    		else if (event.key === "ArrowLeft") nextIndex = (index - 1 + TAB_IDS.length) % TAB_IDS.length;
    		else if (event.key === "Home") nextIndex = 0;
    		else if (event.key === "End") nextIndex = TAB_IDS.length - 1;
    		if (nextIndex === void 0) return;
    		event.preventDefault();
    		const next = TAB_IDS[nextIndex];
    		if (next === void 0) return;
    		setActiveId(next);
    		tabRefs.current[nextIndex]?.focus();
    	}, [activeId]);
    	const subtitle = (id) => {
    		if (id === "browse") return t("market.browse.subtitle");
    		if (id === "installed") return t("market.installed.subtitle");
    		return t("market.account.subtitle");
    	};
    	const heading = (id) => {
    		if (id === "browse") return t("market.browse.title");
    		if (id === "installed") return t("market.installed.title");
    		return t("market.account.title");
    	};
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
    		className: "dshFishMarket",
    		children: [
    			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
    				className: "dshFishMarket__header",
    				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					className: "dshFishMarket__identity",
    					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
    						className: "dshFishMarket__mark",
    						"aria-hidden": "true",
    						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StorefrontIcon, { size: 22 })
    					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    						className: "dshFishMarket__identityText",
    						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
    							className: "dshFishMarket__title",
    							children: t("market.title")
    						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    							className: "dshFishMarket__subtitle",
    							children: t("market.subtitle", { profile: profile ?? "…" })
    						})]
    					})]
    				}), onClose !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
    					className: "dshFishMarket__close",
    					type: "button",
    					onClick: onClose,
    					children: t("market.close")
    				})]
    			}),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    				className: "dshFishMarket__tabsRow",
    				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
    					className: "dshFishMarket__tabs",
    					role: "tablist",
    					"aria-label": t("tabs.aria"),
    					onKeyDown: onTabKeyDown,
    					children: TAB_IDS.map((id, index) => {
    						const selected = id === activeId;
    						return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
    							ref: (element) => {
    								tabRefs.current[index] = element;
    							},
    							id: `${tabsId}-tab-${id}`,
    							className: selected ? "dshFishMarket__tab dshFishMarket__tab--active" : "dshFishMarket__tab",
    							type: "button",
    							role: "tab",
    							"aria-selected": selected,
    							"aria-controls": `${tabsId}-panel-${id}`,
    							tabIndex: selected ? 0 : -1,
    							onClick: () => {
    								selectTab(id);
    							},
    							children: t(`market.tab.${id}`)
    						}, id);
    					})
    				})
    			}),
    			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    				className: "dshFishMarket__body",
    				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					className: "dshFishMarket__pageHead",
    					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
    						className: "dshFishMarket__pageTitle",
    						children: heading(activeId)
    					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
    						className: "dshFishMarket__pageSubtitle",
    						children: subtitle(activeId)
    					})]
    				}), TAB_IDS.map((id) => visitedIds.has(id) ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
    					id: `${tabsId}-panel-${id}`,
    					role: "tabpanel",
    					"aria-labelledby": `${tabsId}-tab-${id}`,
    					hidden: id !== activeId,
    					className: "dshFishMarket__panel",
    					children: [
    						id === "browse" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BrowseTab, { t }),
    						id === "installed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InstalledTab, { t }),
    						id === "account" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountTab, { t })
    					]
    				}, id) : null)]
    			})
    		]
    	});
    }

    //#endregion
    //#region src/client/styles.ts
    /**
    * Section styling, in the harness's own design tokens with robust fallbacks.
    *
    * `--dsw-alias-*` are the client's theme aliases. We define semantic local `--dsh-*`
    * tokens with fallbacks for both light and dark themes so components and modals never
    * render as transparent or unstyled.
    */
    /**
    * Storefront chrome for the main-column market page.
    *
    * Kept separate from the settings-section rules above on purpose: the section
    * renders inside a settings modal at 760px, while the market owns the whole main
    * column and must fill it. Sharing one block would mean either the section
    * inherits full-bleed rules or the market inherits a max-width it cannot use.
    *
    * The page defines the same semantic tokens as `.dshFish`, because it is a
    * separate React root in a different part of the tree and cannot inherit them.
    */
    const marketStyles = String.raw`
    .dshFishMarket {
      --dsh-bg-primary: var(--dsw-alias-bg-primary, #ffffff);
      --dsh-bg-secondary: var(--dsw-alias-bg-secondary, #f4f4f6);
      --dsh-bg-card: var(--dsw-alias-bg-card, #ffffff);
      --dsh-bg-elevated: var(--dsw-alias-bg-elevated, #ffffff);
      --dsh-border-l1: var(--dsw-alias-border-l1, #e4e4e7);
      --dsh-border-l2: var(--dsw-alias-border-l2, #ebebee);
      --dsh-text-primary: var(--dsw-alias-label-primary, #18181b);
      --dsh-text-secondary: var(--dsw-alias-label-secondary, #52525b);
      --dsh-text-tertiary: var(--dsw-alias-label-tertiary, #71717a);
      --dsh-brand-primary: var(--dsw-alias-state-business-primary, #0070f3);

      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      color: var(--dsh-text-primary);
      background: var(--dsh-bg-primary);
    }

    @media (prefers-color-scheme: dark) {
      .dshFishMarket {
        --dsh-bg-primary: var(--dsw-alias-bg-primary, #18181b);
        --dsh-bg-secondary: var(--dsw-alias-bg-secondary, #222226);
        --dsh-bg-card: var(--dsw-alias-bg-card, #1f1f23);
        --dsh-bg-elevated: var(--dsw-alias-bg-elevated, #242428);
        --dsh-border-l1: var(--dsw-alias-border-l1, #3f3f46);
        --dsh-border-l2: var(--dsw-alias-border-l2, #2e2e33);
        --dsh-text-primary: var(--dsw-alias-label-primary, #f4f4f5);
        --dsh-text-secondary: var(--dsw-alias-label-secondary, #a1a1aa);
        --dsh-text-tertiary: var(--dsw-alias-label-tertiary, #71717a);
      }
    }

    [data-theme="dark"] .dshFishMarket,
    .dark .dshFishMarket {
      --dsh-bg-primary: var(--dsw-alias-bg-primary, #18181b);
      --dsh-bg-secondary: var(--dsw-alias-bg-secondary, #222226);
      --dsh-bg-card: var(--dsw-alias-bg-card, #1f1f23);
      --dsh-bg-elevated: var(--dsw-alias-bg-elevated, #242428);
      --dsh-border-l1: var(--dsw-alias-border-l1, #3f3f46);
      --dsh-border-l2: var(--dsw-alias-border-l2, #2e2e33);
      --dsh-text-primary: var(--dsw-alias-label-primary, #f4f4f5);
      --dsh-text-secondary: var(--dsw-alias-label-secondary, #a1a1aa);
      --dsh-text-tertiary: var(--dsw-alias-label-tertiary, #71717a);
    }

    .dshFishMarket__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 28px 14px;
      border-bottom: 1px solid var(--dsh-border-l2);
      flex: none;
    }
    .dshFishMarket__identity {
      display: flex;
      gap: 12px;
      align-items: center;
      min-width: 0;
    }
    .dshFishMarket__mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      color: var(--dsh-brand-primary);
      background: var(--dsh-bg-secondary);
      flex: none;
    }
    .dshFishMarket__identityText {
      min-width: 0;
    }
    .dshFishMarket__title {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      line-height: 1.3;
    }
    .dshFishMarket__subtitle {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--dsh-text-secondary);
    }
    .dshFishMarket__close {
      flex: none;
      padding: 6px 12px;
      font-size: 12px;
      color: var(--dsh-text-secondary);
      background: transparent;
      border: 1px solid var(--dsh-border-l1);
      border-radius: 8px;
      cursor: pointer;
    }
    .dshFishMarket__close:hover {
      color: var(--dsh-text-primary);
      background: var(--dsh-bg-secondary);
    }

    .dshFishMarket__tabsRow {
      padding: 0 28px;
      border-bottom: 1px solid var(--dsh-border-l2);
      flex: none;
    }
    .dshFishMarket__tabs {
      display: flex;
      gap: 4px;
    }
    .dshFishMarket__tab {
      padding: 10px 4px;
      margin-bottom: -1px;
      font-size: 13px;
      font-weight: 500;
      color: var(--dsh-text-secondary);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
    }
    .dshFishMarket__tab + .dshFishMarket__tab {
      margin-left: 16px;
    }
    .dshFishMarket__tab:hover {
      color: var(--dsh-text-primary);
    }
    .dshFishMarket__tab--active {
      color: var(--dsh-text-primary);
      border-bottom-color: var(--dsh-brand-primary);
    }
    .dshFishMarket__tab:focus-visible {
      outline: 2px solid var(--dsh-brand-primary);
      outline-offset: 2px;
      border-radius: 4px;
    }

    .dshFishMarket__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 20px 28px 40px;
    }
    .dshFishMarket__pageHead {
      margin-bottom: 16px;
    }
    .dshFishMarket__pageTitle {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }
    .dshFishMarket__pageSubtitle {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--dsh-text-tertiary);
    }

    /* The panels were written for a settings column; give their content the full
       main-column width instead of the section's 760px cap. */
    .dshFishMarket__panel > .dshFish {
      max-width: none;
    }
    .dshFishMarket__panel[hidden] {
      display: none;
    }

    @media (max-width: 720px) {
      .dshFishMarket__header,
      .dshFishMarket__tabsRow,
      .dshFishMarket__body {
        padding-left: 16px;
        padding-right: 16px;
      }
    }
    `;
    const styles = String.raw`
    /* Semantic tokens with solid fallbacks */
    .dshFish,
    .dshFish__modalOverlay {
      --dsh-bg-primary: var(--dsw-alias-bg-primary, #ffffff);
      --dsh-bg-secondary: var(--dsw-alias-bg-secondary, #f4f4f6);
      --dsh-bg-elevated: var(--dsw-alias-bg-elevated, #ffffff);
      --dsh-bg-modal: var(--dsw-alias-bg-elevated, var(--dsw-alias-bg-primary, #ffffff));
      --dsh-bg-card: var(--dsw-alias-bg-card, #ffffff);
      --dsh-border-l1: var(--dsw-alias-border-l1, #e4e4e7);
      --dsh-border-l2: var(--dsw-alias-border-l2, #ebebee);
      --dsh-text-primary: var(--dsw-alias-label-primary, #18181b);
      --dsh-text-secondary: var(--dsw-alias-label-secondary, #52525b);
      --dsh-text-tertiary: var(--dsw-alias-label-tertiary, #71717a);
      --dsh-brand-primary: var(--dsw-alias-state-business-primary, #0070f3);
      --dsh-code-bg: var(--dsw-alias-bg-secondary, #f4f4f6);
    }

    @media (prefers-color-scheme: dark) {
      .dshFish,
      .dshFish__modalOverlay {
        --dsh-bg-primary: var(--dsw-alias-bg-primary, #18181b);
        --dsh-bg-secondary: var(--dsw-alias-bg-secondary, #222226);
        --dsh-bg-elevated: var(--dsw-alias-bg-elevated, #242428);
        --dsh-bg-modal: var(--dsw-alias-bg-elevated, var(--dsw-alias-bg-primary, #1e1e22));
        --dsh-bg-card: var(--dsw-alias-bg-card, #1f1f23);
        --dsh-border-l1: var(--dsw-alias-border-l1, #3f3f46);
        --dsh-border-l2: var(--dsw-alias-border-l2, #2e2e33);
        --dsh-text-primary: var(--dsw-alias-label-primary, #f4f4f5);
        --dsh-text-secondary: var(--dsw-alias-label-secondary, #a1a1aa);
        --dsh-text-tertiary: var(--dsw-alias-label-tertiary, #71717a);
        --dsh-brand-primary: var(--dsw-alias-state-business-primary, #0070f3);
        --dsh-code-bg: var(--dsw-alias-bg-secondary, #242428);
      }
    }

    [data-theme="dark"] .dshFish,
    [data-theme="dark"] .dshFish__modalOverlay,
    .dark .dshFish,
    .dark .dshFish__modalOverlay {
      --dsh-bg-primary: var(--dsw-alias-bg-primary, #18181b);
      --dsh-bg-secondary: var(--dsw-alias-bg-secondary, #222226);
      --dsh-bg-elevated: var(--dsw-alias-bg-elevated, #242428);
      --dsh-bg-modal: var(--dsw-alias-bg-elevated, var(--dsw-alias-bg-primary, #1e1e22));
      --dsh-bg-card: var(--dsw-alias-bg-card, #1f1f23);
      --dsh-border-l1: var(--dsw-alias-border-l1, #3f3f46);
      --dsh-border-l2: var(--dsw-alias-border-l2, #2e2e33);
      --dsh-text-primary: var(--dsw-alias-label-primary, #f4f4f5);
      --dsh-text-secondary: var(--dsw-alias-label-secondary, #a1a1aa);
      --dsh-text-tertiary: var(--dsw-alias-label-tertiary, #71717a);
      --dsh-brand-primary: var(--dsw-alias-state-business-primary, #0070f3);
      --dsh-code-bg: var(--dsw-alias-bg-secondary, #242428);
    }

    .dshFish {
      max-width: 760px;
      color: var(--dsh-text-primary);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .dshFish__header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dshFish__headerTitleRow {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dshFish__heading {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .dshFish__versionBadge {
      font-size: 11px;
      font-weight: 600;
      padding: 1px 7px;
      border-radius: 999px;
      background: var(--dsh-bg-secondary);
      border: 1px solid var(--dsh-border-l2);
      color: var(--dsh-text-secondary);
      font-family: monospace;
    }
    .dshFish__checkUpdateBtn {
      border: 1px solid var(--dsh-border-l2);
      background: transparent;
      color: var(--dsh-text-secondary);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .dshFish__checkUpdateBtn:hover:not(:disabled) {
      color: var(--dsh-text-primary);
      background: var(--dsh-bg-secondary);
      border-color: var(--dsh-border-l1);
    }
    .dshFish__checkUpdateBtn:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .dshFish__updateBanner {
      margin-top: 4px;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(0, 112, 243, 0.08);
      border: 1px solid rgba(0, 112, 243, 0.25);
      color: var(--dsh-text-primary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 12.5px;
      font-weight: 500;
    }
    .dshFish__intro {
      margin: 0;
      color: var(--dsh-text-tertiary);
      font-size: 13px;
      line-height: 1.5;
    }
    .dshFish__tabs {
      border-bottom: 1px solid var(--dsh-border-l2);
      display: flex;
      align-items: flex-end;
      gap: 22px;
      margin-top: 2px;
    }
    .dshFish__tab {
      border: 0;
      padding: 8px 2px 10px;
      position: relative;
      background: transparent;
      color: var(--dsh-text-tertiary);
      font: inherit;
      font-size: 13px;
      font-weight: 500;
      line-height: 20px;
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .dshFish__tab:hover,
    .dshFish__tab[data-active="true"] {
      color: var(--dsh-text-primary);
    }
    .dshFish__tab[data-active="true"]::after,
    .dshFish__tab:focus-visible::after {
      content: "";
      height: 2px;
      border-radius: 2px 2px 0 0;
      position: absolute;
      right: 0;
      bottom: -1px;
      left: 0;
      background: var(--dsh-text-primary);
    }
    .dshFish__tab:focus-visible {
      border-radius: 2px;
      outline: 2px solid var(--dsh-brand-primary);
      outline-offset: 2px;
    }
    .dshFish__panel {
      min-width: 0;
      padding-top: 2px;
    }
    .dshFish__panelBody {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .dshFish__search {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .dshFish__input,
    .dshFish__select {
      border: 1px solid var(--dsh-border-l2);
      border-radius: 8px;
      padding: 7px 11px;
      background: var(--dsh-bg-primary);
      color: var(--dsh-text-primary);
      font: inherit;
      font-size: 13px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .dshFish__input:focus,
    .dshFish__select:focus {
      outline: none;
      border-color: var(--dsh-brand-primary);
      box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.15);
    }
    .dshFish__input {
      flex: 1 1 220px;
      min-width: 0;
    }
    .dshFish__button,
    .dshFish__buttonQuiet {
      border: 1px solid var(--dsh-border-l2);
      border-radius: 8px;
      padding: 6px 13px;
      background: var(--dsh-bg-secondary);
      color: var(--dsh-text-primary);
      font: inherit;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .dshFish__button:hover:not(:disabled) {
      background: var(--dsh-bg-primary);
      border-color: var(--dsh-border-l1);
    }
    .dshFish__button:disabled,
    .dshFish__buttonQuiet:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .dshFish__button--sm {
      padding: 4px 10px;
      font-size: 12px;
      border-radius: 6px;
    }
    .dshFish__buttonQuiet {
      background: transparent;
      color: var(--dsh-text-secondary);
    }
    .dshFish__buttonQuiet:hover:not(:disabled) {
      background: var(--dsh-bg-secondary);
      color: var(--dsh-text-primary);
    }
    .dshFish__button--primary {
      background: var(--dsh-brand-primary);
      border-color: var(--dsh-brand-primary);
      color: #ffffff;
    }
    .dshFish__button--primary:hover:not(:disabled) {
      background: var(--dsh-brand-primary);
      filter: brightness(1.1);
      border-color: transparent;
      color: #ffffff;
    }
    .dshFish__button--destructive {
      color: #dc2626;
      border-color: rgba(220, 38, 38, 0.25);
    }
    .dshFish__button--destructive:hover:not(:disabled) {
      background: rgba(220, 38, 38, 0.08);
      border-color: #dc2626;
      color: #dc2626;
    }

    @keyframes dshFishSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .dshFish__spin {
      animation: dshFishSpin 0.75s linear infinite;
      display: inline-block;
      flex-shrink: 0;
    }

    .dshFish__list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dshFish__card {
      border: 1px solid var(--dsh-border-l2);
      border-radius: 12px;
      padding: 14px 16px;
      background-color: var(--dsh-bg-card);
      color: var(--dsh-text-primary);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .dshFish__card--clickable {
      cursor: pointer;
    }
    .dshFish__card--clickable:hover {
      border-color: var(--dsh-brand-primary);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
    .dshFish__card--clickable:focus-visible {
      outline: 2px solid var(--dsh-brand-primary);
      outline-offset: 2px;
    }
    .dshFish__cardHead {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .dshFish__cardName {
      font-size: 14.5px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--dsh-text-primary);
    }
    .dshFish__cardSummary {
      margin: 0;
      color: var(--dsh-text-secondary);
      font-size: 13px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .dshFish__cardFoot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .dshFish__cardActions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .dshFish__tag {
      border-radius: 999px;
      padding: 1.5px 8px;
      font-size: 11px;
      font-weight: 500;
      line-height: 18px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .dshFish__tag--kind {
      background: var(--dsh-bg-secondary);
      border: 1px solid var(--dsh-border-l2);
      color: var(--dsh-text-secondary);
    }
    .dshFish__tag--verified {
      background: rgba(0, 112, 243, 0.08);
      color: var(--dsh-brand-primary);
      border: 1px solid rgba(0, 112, 243, 0.22);
    }
    .dshFish__tag--deprecated {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.22);
    }
    .dshFish__tag--ai {
      background: rgba(147, 51, 234, 0.08);
      color: #9333ea;
      border: 1px solid rgba(147, 51, 234, 0.22);
    }
    .dshFish__meta,
    .dshFish__empty {
      margin: 0;
      color: var(--dsh-text-tertiary);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .dshFish__link {
      color: var(--dsh-brand-primary);
      font-size: 12px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .dshFish__link:hover {
      text-decoration: underline;
    }
    .dshFish__link--source {
      font-weight: 500;
    }
    .dshFish__warning,
    .dshFish__error {
      margin: 0;
      font-size: 12px;
      line-height: 18px;
    }
    .dshFish__warning {
      color: var(--dsh-text-secondary);
    }
    .dshFish__error {
      color: #dc2626;
    }
    .dshFish__notice {
      margin: 0;
      color: var(--dsh-text-secondary);
      font-size: 12px;
    }
    .dshFish__device {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
      padding: 12px;
      background: var(--dsh-bg-secondary);
      border: 1px solid var(--dsh-border-l2);
      border-radius: 10px;
    }
    .dshFish__code {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.05em;
      font-family: monospace;
    }
    .dshFish__waitingRow {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dshFish__signedOut {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    /* Avatar Component */
    .dshFish__avatar {
      border-radius: 50%;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--dsh-bg-secondary);
      border: 1px solid var(--dsh-border-l2);
      color: var(--dsh-text-primary);
      flex-shrink: 0;
      user-select: none;
    }
    .dshFish__avatarImg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .dshFish__avatarInitial {
      font-size: 16px;
      font-weight: 600;
      line-height: 1;
    }

    /* Tooltip Component */
    .dshFish__tooltipWrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .dshFish__avatarTrigger {
      cursor: pointer;
      display: inline-flex;
      border-radius: 50%;
      transition: transform 0.15s ease;
    }
    .dshFish__avatarTrigger:hover {
      transform: scale(1.04);
    }
    .dshFish__tooltip {
      position: absolute;
      z-index: 1000;
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      background: var(--dsh-bg-secondary);
      color: var(--dsh-text-primary);
      border: 1px solid var(--dsh-border-l1);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
      opacity: 0;
      animation: dshFishTooltipFade 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .dshFish__tooltip--top {
      bottom: calc(100% + 7px);
      left: 50%;
      transform: translateX(-50%);
    }
    .dshFish__tooltip--bottom {
      top: calc(100% + 7px);
      left: 50%;
      transform: translateX(-50%);
    }
    @keyframes dshFishTooltipFade {
      from { opacity: 0; transform: translate(-50%, 3px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    /* Account Card */
    .dshFish__accountCard {
      border: 1px solid var(--dsh-border-l2);
      border-radius: 12px;
      padding: 16px 18px;
      background: var(--dsh-bg-card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .dshFish__accountInfo {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .dshFish__accountText {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .dshFish__accountName {
      font-size: 15px;
      font-weight: 600;
      color: var(--dsh-text-primary);
    }
    .dshFish__accountSub {
      font-size: 12px;
      color: var(--dsh-text-tertiary);
    }

    /* Plugin Maintenance Section */
    .dshFish__pluginSection {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dshFish__sectionTitle {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--dsh-text-secondary);
    }
    .dshFish__pluginCard {
      border: 1px solid var(--dsh-border-l2);
      border-radius: 12px;
      padding: 14px 16px;
      background: var(--dsh-bg-card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }
    .dshFish__pluginInfo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dshFish__pluginName {
      font-size: 13.5px;
      font-weight: 600;
      font-family: monospace;
      color: var(--dsh-text-primary);
    }
    .dshFish__pluginActions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Modal Dialog - Rock solid non-transparent background */
    .dshFish__modalOverlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .dshFish__modal {
      background-color: var(--dsh-bg-modal);
      color: var(--dsh-text-primary);
      border: 1px solid var(--dsh-border-l1);
      border-radius: 14px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--dsh-border-l1);
      width: 100%;
      max-width: 820px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: dshFishModalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dshFishModalEnter {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .dshFish__modalHead {
      padding: 16px 22px;
      border-bottom: 1px solid var(--dsh-border-l2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background-color: var(--dsh-bg-modal);
      color: var(--dsh-text-primary);
    }
    .dshFish__modalHeadTitle {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .dshFish__modalTitle {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--dsh-text-primary);
      overflow-wrap: break-word;
    }
    .dshFish__modalBadges {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .dshFish__modalHeadActions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .dshFish__modalClose {
      border: 0;
      background: transparent;
      cursor: pointer;
      color: var(--dsh-text-tertiary);
      padding: 6px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .dshFish__modalClose:hover {
      color: var(--dsh-text-primary);
      background: var(--dsh-bg-secondary);
    }
    .dshFish__modalMeta {
      padding: 12px 22px;
      background-color: var(--dsh-bg-secondary);
      border-bottom: 1px solid var(--dsh-border-l2);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dshFish__modalSummary {
      margin: 0;
      font-size: 13px;
      color: var(--dsh-text-secondary);
      line-height: 1.5;
    }
    .dshFish__modalMetaRow {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      font-size: 12px;
    }
    .dshFish__modalBody {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      min-height: 200px;
      background-color: var(--dsh-bg-modal);
      color: var(--dsh-text-primary);
    }
    .dshFish__modalLoading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 56px 0;
      color: var(--dsh-text-tertiary);
      font-size: 13px;
    }

    /* Markdown Prose in Readme Modal */
    .dshFish__prose {
      font-size: 13.5px;
      line-height: 1.7;
      color: var(--dsh-text-primary);
      word-break: break-word;
    }
    .dshFish__h1 { font-size: 21px; font-weight: 700; margin: 20px 0 10px; border-bottom: 1px solid var(--dsh-border-l2); padding-bottom: 8px; color: var(--dsh-text-primary); }
    .dshFish__h2 { font-size: 18px; font-weight: 600; margin: 18px 0 8px; border-bottom: 1px solid var(--dsh-border-l2); padding-bottom: 6px; color: var(--dsh-text-primary); }
    .dshFish__h3 { font-size: 15.5px; font-weight: 600; margin: 15px 0 6px; color: var(--dsh-text-primary); }
    .dshFish__h4 { font-size: 14px; font-weight: 600; margin: 12px 0 4px; color: var(--dsh-text-primary); }
    .dshFish__h5, .dshFish__h6 { font-size: 13px; font-weight: 600; margin: 10px 0 4px; color: var(--dsh-text-primary); }
    .dshFish__p { margin: 10px 0; line-height: 1.7; color: var(--dsh-text-primary); }
    .dshFish__codeInline {
      background: var(--dsh-code-bg);
      border: 1px solid var(--dsh-border-l2);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-size: 0.9em;
      color: var(--dsh-text-primary);
    }
    .dshFish__codeBlock {
      margin: 14px 0;
      border: 1px solid var(--dsh-border-l2);
      border-radius: 8px;
      overflow: hidden;
      background: var(--dsh-code-bg);
    }
    .dshFish__codeBlockHead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid var(--dsh-border-l2);
      background: var(--dsh-bg-primary);
      font-size: 11px;
      color: var(--dsh-text-tertiary);
    }
    .dshFish__codeLang {
      font-family: monospace;
      text-transform: lowercase;
    }
    .dshFish__codeCopyBtn {
      border: 0;
      background: transparent;
      color: var(--dsh-text-tertiary);
      font-size: 11px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }
    .dshFish__codeCopyBtn:hover {
      color: var(--dsh-text-primary);
      background: var(--dsh-bg-secondary);
    }
    .dshFish__pre {
      margin: 0;
      padding: 14px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 12.5px;
      line-height: 1.6;
      color: var(--dsh-text-primary);
    }
    .dshFish__ul, .dshFish__ol {
      margin: 10px 0;
      padding-left: 22px;
    }
    .dshFish__ul li, .dshFish__ol li {
      margin: 4px 0;
      line-height: 1.6;
    }
    .dshFish__taskItem {
      list-style: none;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 4px 0;
    }
    .dshFish__checkbox {
      margin-top: 4px;
      cursor: default;
    }
    .dshFish__blockquote {
      margin: 12px 0;
      padding: 6px 14px;
      border-left: 3px solid var(--dsh-brand-primary);
      background: var(--dsh-bg-secondary);
      border-radius: 0 6px 6px 0;
      color: var(--dsh-text-secondary);
    }
    .dshFish__hr {
      border: 0;
      border-top: 1px solid var(--dsh-border-l2);
      margin: 20px 0;
    }
    .dshFish__tableWrapper {
      margin: 14px 0;
      overflow-x: auto;
      border: 1px solid var(--dsh-border-l2);
      border-radius: 8px;
    }
    .dshFish__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .dshFish__table th, .dshFish__table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--dsh-border-l2);
      text-align: left;
    }
    .dshFish__table th {
      background: var(--dsh-bg-secondary);
      font-weight: 600;
      color: var(--dsh-text-primary);
    }
    .dshFish__table tr:last-child td {
      border-bottom: 0;
    }
    .dshFish__proseImg {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 10px 0;
      display: block;
    }
    .dshFish__badgeImg {
      display: inline-block;
      vertical-align: middle;
      height: auto;
      max-height: 24px;
    }
    .dshFish__badgeLink {
      display: inline-block;
      vertical-align: middle;
      margin: 2px 4px 2px 0;
    }
    .dshFish__srOnly {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    ${marketStyles}
    `;

    //#endregion
    //#region src/client/index.tsx
    /** Panel key shared by the left-rail icon and the main-column page. */
    const PANEL_ID = "dsh-fish-market";
    const inject = ["slots", "locale"];
    function apply(ctx) {
    	ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), "dsh.fish: dictionaries");
    	const t = ctx.locale.bind(LOCALE_NS);
    	ctx.effect(() => {
    		const style = document.createElement("style");
    		style.dataset["plugin"] = "@dsh-fish/hub";
    		style.textContent = styles;
    		document.head.append(style);
    		return () => {
    			style.remove();
    		};
    	}, "dsh.fish: styles");
    	ctx.slots.inject("settings.section", () => ctx.slots.register({
    		name: "settings.section",
    		id: "dsh-fish",
    		order: 30,
    		label: () => t("nav"),
    		locale: LOCALE_NS
    	}, HubSection));
    	ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
    		name: "sidebar.panellist",
    		id: PANEL_ID,
    		order: 20,
    		label: () => t("panel.label"),
    		locale: LOCALE_NS
    	}, MarketPanelIcon));
    	ctx.slots.inject("main", () => ctx.slots.register({
    		name: "main",
    		key: PANEL_ID,
    		locale: LOCALE_NS,
    		inject: () => ({ closeMarket: () => layoutOf(ctx)?.selectPanel(null) })
    	}, MarketPageBound));
    }
    /** The rail glyph: the harness owns the button, label and selected state. */
    function MarketPanelIcon({ size }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StorefrontIcon, { size });
    }
    /**
    * The page occupant.
    *
    * `main` supplies no owner props: the translate function arrives from the
    * entry's declared `locale` namespace, and the close affordance from the
    * entry's inject face — never from the shell.
    */
    function MarketPageBound({ t, closeMarket }) {
    	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarketPage, {
    		t,
    		onClose: closeMarket
    	});
    }
    /**
    * The layout service, when the composition provides one.
    *
    * Read through `ctx.get` rather than declared in `inject` so this plugin still
    * loads on a surface that has no layout (a headless profile has no client at
    * all, but a future embedding might have slots without a main column).
    */
    function layoutOf(ctx) {
    	const layout = ctx.get("layout");
    	return typeof layout?.selectPanel === "function" ? layout : void 0;
    }

    //#endregion
    exports.PANEL_ID = PANEL_ID;
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
