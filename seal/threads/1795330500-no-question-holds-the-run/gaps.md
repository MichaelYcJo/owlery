# Closing memo: 1795330500-no-question-holds-the-run

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate at HEAD, its comparison of the headings and the table rows of each document of `docs/` with its Korean edition among it. Phase 1 counted the two pairs it changed with `grep -c` and ran nothing else | the orchestrator, by the broad gate after the rounds settle |
| The cases behind the check lines phase 1 wrote into `docs/product.md` and `docs/architecture.md`. Phase 2 wrote the cases of the decisions into the two test files the lines name, and phase 3 the cases of the park, of the answer and of a parked work item's line. The cases of the summary's count of decisions do not exist until the code of phase 4 does | the crafter of phase 4, whose cases are scenario 15 of `frame/design.md` |
| Whether the Korean paragraphs read as natural Korean to a person. Phase 1 wrote the frame's text as given and read it against the plugin's Korean sentence rules | the proofer, and the owner where a sentence is the product's voice |
| The drawing of the decisions in the window: the mark on a line (`apps/desktop/src/renderer/list.ts`), the list in the preview and in the view (`apps/desktop/src/renderer/shared.ts#detail`), and the dialog that reverses one (`apps/desktop/src/renderer/renderer.ts#openReverse`, `index.html`). Phase 2 read this code and ran no case of it: no message puts a decision into the built app's daemon, so the built-app files it ran drew a page with no decision | the crafter of phase 4, by the case of scenario 17 of `frame/design.md` |
| The drawing of a parked work item in the window: the section of its view that holds the questions and sends the answers (`apps/desktop/src/renderer/work-item-view.ts#showQuestions`, `#sendAnswers` and `#takeAnswers`, `index.html`), the notification the window raises at a park and what its click opens (`apps/desktop/src/renderer/renderer.ts#takeLists`), and the age counted from the park on a line, in the preview, in the sidebar, in the summary and in the view. Phase 3 read this code and ran no case of it with a parked work item: no message parks one in the built app's daemon. The built-app files it ran drew every one of these with no record, where the section is hidden | the crafter of phase 4, by the case of scenario 17 of `frame/design.md`, which chooses an option and types another answer with the keyboard alone. The notification's raising and its click are in no scenario of the frame: the proofer reads them, and the owner sees them in the running app |
| How the section of questions looks in the two themes, whether it belongs above the facts of the right column, and whether its words ("Waiting for your answer", "Asked by sealer, 12 min ago", "Another answer", "Send answers") are the product's. The styles are new rules of `apps/desktop/src/renderer/index.html` that no case reads | the owner, by a look at the running app once phase 4's case can park a work item in it |
| How the list of decisions, the mark and the dialog look in the two themes, and whether "Reverse" is where a person expects it. The styles are new rules of `apps/desktop/src/renderer/index.html` that no case reads | the owner, by a look at the running app once phase 4's case can put a decision into it |

## Not done

`docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Moving records to another machine", and its Korean row list the daemon's state as "(progress, the cost ledger, questions and answers)". Phase 1 added the decisions to the row of *State lives in three places* and left this shorter list as it was: `frame/design.md` *Data & interfaces* names no entry for it, and the sentence is about what moves between machines, which the list illustrates and does not bound.

Phase 2 left three things within reach.

- **No bound on how many decisions a work item keeps.** Every `inbox` carries every decision of every work item. `frame/plan.md` *Technical context* names this as the third failure of the chosen approach and asks for no bound now, and nothing calls `Daemon#decided` but the cases until #41 and #51.
- **The sidebar's lines carry no mark of the decisions.** The mark stands on the lines of the inbox, the history and the archived screen, which share one function. `frame/design.md` *Scope* item 5 names the inbox's line, and a sidebar line has no second row to hold the mark.
- **A decision of an archived work item cannot be reversed in the window.** The archived screen's preview lists the decisions, and "Reverse" stands only in a work item's view, which an archived work item does not have. The daemon takes a `reverseDecision` for one. `frame/design.md` *Scope* item 5 puts the control in the view.

Phase 3 left four things within reach.

- **The preview of the inbox does not hold the questions.** A parked work item's line says its first question, and the questions are answered in its view. `frame/design.md` *Scope* item 11 puts the section in the view, and #53 builds the question screen.
- **A parked work item that is archived cannot be answered in the window.** The archived screen opens no view. The daemon takes an `answerQuestions` for an archived work item, as it takes a reversal for one, and `Daemon#park` refuses to park one.
- **The window raises no notification for a park it finds at its start.** A `ready` carries the states as the window finds them, and the window notifies of none of them, a parked work item among them. The summary opens on a work item parked since the last look, since its line's state changed.
- **`Daemon#park` takes two options of one question with the same label.** The answer stored is an option's label, so the record does not say which of the two was chosen. `frame/design.md` *Scope* item 8 names no such refusal, and the callers are #41's and #42's to write.
