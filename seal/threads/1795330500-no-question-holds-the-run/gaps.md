# Closing memo: 1795330500-no-question-holds-the-run

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate at HEAD, its comparison of the headings and the table rows of each document of `docs/` with its Korean edition among it. Phase 1 counted the two pairs it changed with `grep -c` and ran nothing else | the orchestrator, by the broad gate after the rounds settle |
| The cases behind the check lines phase 1 wrote into `docs/product.md` and `docs/architecture.md`. Phase 2 wrote the cases of the decisions into the two test files the lines name. The cases of the park, of a parked work item's line and of the summary's count of decisions do not exist until the code of phases 3 and 4 does | the crafter of phases 3 and 4, whose cases are scenarios 5 to 8, 11, 13 and 15, and the parts of scenarios 9, 12, 14, 16 and 18 that read `asked`, of `frame/design.md` |
| Whether the Korean paragraphs read as natural Korean to a person. Phase 1 wrote the frame's text as given and read it against the plugin's Korean sentence rules | the proofer, and the owner where a sentence is the product's voice |
| The drawing of the decisions in the window: the mark on a line (`apps/desktop/src/renderer/list.ts`), the list in the preview and in the view (`apps/desktop/src/renderer/shared.ts#detail`), and the dialog that reverses one (`apps/desktop/src/renderer/renderer.ts#openReverse`, `index.html`). Phase 2 read this code and ran no case of it: no message puts a decision into the built app's daemon, so the built-app files it ran drew a page with no decision | the crafter of phase 4, by the case of scenario 17 of `frame/design.md` |
| How the list of decisions, the mark and the dialog look in the two themes, and whether "Reverse" is where a person expects it. The styles are new rules of `apps/desktop/src/renderer/index.html` that no case reads | the owner, by a look at the running app once phase 4's case can put a decision into it |

## Not done

`docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Moving records to another machine", and its Korean row list the daemon's state as "(progress, the cost ledger, questions and answers)". Phase 1 added the decisions to the row of *State lives in three places* and left this shorter list as it was: `frame/design.md` *Data & interfaces* names no entry for it, and the sentence is about what moves between machines, which the list illustrates and does not bound.

Phase 2 left three things within reach.

- **No bound on how many decisions a work item keeps.** Every `inbox` carries every decision of every work item. `frame/plan.md` *Technical context* names this as the third failure of the chosen approach and asks for no bound now, and nothing calls `Daemon#decided` but the cases until #41 and #51.
- **The sidebar's lines carry no mark of the decisions.** The mark stands on the lines of the inbox, the history and the archived screen, which share one function. `frame/design.md` *Scope* item 5 names the inbox's line, and a sidebar line has no second row to hold the mark.
- **A decision of an archived work item cannot be reversed in the window.** The archived screen's preview lists the decisions, and "Reverse" stands only in a work item's view, which an archived work item does not have. The daemon takes a `reverseDecision` for one. `frame/design.md` *Scope* item 5 puts the control in the view.
