"""Shared opt-in: does this repository keep IADD's records?

Imported by the gates rather than copied into each, because where the answer
moves, divergent copies are how half of them keep the old one.

The signal is `agentory/`, the records root, whose existence is the declaration,
at the first of two places that has it with its `README.md` opening with
`MARKER`: `<repo>/agentory/`, which shared mode commits, then
`<git-common-dir>/agentory/`, where local mode keeps it. One root, read one
way, under one name, and no config key. An `agentory/` without the marker is a
directory the project keeps for itself and declares nothing, and the root
has no second name to move to.

`<git-common-dir>/agentic-scratch` takes that declaration back. A repository
that exists for thirty seconds, a fixture built by hand to reproduce a gate
decision, carries the same `agentory/` as a repository under review, and the
gates cannot tell them apart. The opt-out file is written once, by a person,
in the repository being thrown away. It lives under the git directory
rather than inside the root because the root is committed: a file committed
in the root would silence every gate in every clone with nothing in the diff
that read as the records being switched off. Nothing under `.git/` can be
committed, and a linked worktree shares the common directory, so it shares
the opt-out.

Everything here fails toward "not opted in": a gate that cannot tell should do
nothing rather than act on a guess.
"""

import os
import subprocess

HOME = "agentory"
# The sub-directory of the root that holds the work items.
WORK_ITEMS = "threads"
# Where each record sits in a thread, `/`-joined and relative to the thread's
# directory: `frame/` holds the design before the build, `trail/` what passed
# between the parties, and the files at the top speak for the whole
# thread (`docs/layout/the-record-layout.md`). Every reader of a thread's file joins
# one of these under the thread.
FRAME = "frame"
TRAIL = "trail"
DESIGN = f"{FRAME}/design.md"
PLAN = f"{FRAME}/plan.md"
QUESTIONS = f"{FRAME}/questions.md"
PHASES = f"{TRAIL}/phases"
ROUNDS = f"{TRAIL}/rounds"
GATE = f"{TRAIL}/gate.md"
GAPS = "gaps.md"
INSPECTION = "inspection.md"
CHANGELOG = "changelog.md"
# The migration config, directly under the root: `chain_check.py` reads it at
# HEAD under the shared root.
PARITY_CONFIG = "parity.json"
# An empty FILE under the common git directory; its existence is the whole
# signal, read the way the root is read. It is not an entry inside an existing
# file because every gate would then parse one to answer what is a directory
# test. A directory of this name is not the opt-out — see `home_at()` below.
SCRATCH = "agentic-scratch"
# The first line of the `README.md` Owlery's setup writes into every root
# (`apps/desktop/src/shared/protocol.ts#MARKER`): an `agentory/` is the
# records root only where its `README.md` opens with this line.
MARKER = "# What IADD keeps in agentory/"
README = "README.md"


def repo_root(cwd):
    """The repository root containing cwd, or "" when there is none."""
    if not cwd or not os.path.isdir(cwd):
        return ""
    try:
        out = subprocess.run(
            ["git", "-C", cwd, "rev-parse", "--show-toplevel"],
            capture_output=True,
            # Named, and the `.stdout or ""` below is the second half of the
            # same defect. `text=True` alone decodes with whatever locale the
            # parent had; git answers UTF-8, so a repository under a path this
            # locale cannot decode kills subprocess's reader thread -- and that
            # exception DOES NOT PROPAGATE. The call returns with `stdout` set
            # to None, and `.strip()` then raises `AttributeError`, which is
            # neither of the classes caught here.
            #
            # Measured on a cp949 console against a repository under a Korean
            # path: the caller exited 1 with no answer, where it should have
            # read the repository as not opted in. Everything in this module is
            # documented to fail toward "not opted in", and that is silence,
            # not a crash.
            encoding="utf-8",
            errors="replace",
            timeout=5,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return ""
    out = (out or "").strip()
    # Spelled the way this platform spells a path, because that is what every
    # caller does with it: `os.path.join` below, and the gates print it to
    # someone who has to recognise their own repository in it. git answers
    # with forward slashes on every platform, so on Windows the root would
    # arrive in one dialect and be joined in another -- `C:/proj` and then
    # `C:/proj\agentory\parity.json`. Both halves work; neither
    # equals a path the caller built, and the address is the whole point of a
    # module named for having ONE.
    #
    # A no-op where the two dialects already agree, so nothing about the POSIX
    # path changes and `normpath` is not asked to guess anything: git has
    # already resolved this to an absolute, existing directory.
    return os.path.normpath(out) if out else ""


def git_common_dir(root):
    """The common git directory of the repository at `root`, or "".

    `.git` at the toplevel, when it is a directory, IS the repository's git
    directory, and for a main worktree the common directory is that same
    place — so that case is answered without a process. Every gated command
    in every opted-in repository reaches this through `home_at()`, so a
    `git` process started here is paid on every gated command. A `.git`
    that is a file (a linked worktree, a submodule) or absent is asked of git,
    which answers relative to the directory it ran in unless the path is
    absolute; `os.path.join` handles both spellings.
    """
    if not root:
        return ""
    dotgit = os.path.join(root, ".git")
    if os.path.isdir(dotgit):
        return dotgit
    try:
        out = subprocess.run(
            ["git", "-C", root, "rev-parse", "--git-common-dir"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=5,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return ""
    out = (out or "").strip()
    return os.path.normpath(os.path.join(root, out)) if out else ""


def home_paths(root, common=None):
    """The two places `agentory/` is read from at `root`, shared first then local.

    `("", "")` for no root, and the local entry is "" where the common git
    directory could not be resolved. The local entry is `<common>/agentory`, and
    the shared entry `<root>/agentory`. Neither entry is tested for being the
    root: this answers *where would it be*, and `home_at` below answers
    *where is it*.

    `common` is passed by a caller that has already resolved the common git
    directory, so nothing here costs a second `git` call, which every gated
    command would pay.
    """
    if not root:
        return ("", "")
    if common is None:
        common = git_common_dir(root)
    # `normpath` on the git-derived half, and it is not tidying. `git
    # rev-parse --git-common-dir` answers with `/` on Windows as well, so
    # joining `agentory` onto it would produce `C:/Users/x/repo\.git\agentory` -- one
    # path spelled two ways, printed to a person in the gate's question and
    # in chain-check's local-mode sentence. Nothing here hands `home` to
    # git, so the native spelling is the right one, and normalising at the
    # source closes it for every caller rather than at each of the four
    # places that print it.
    return (
        os.path.join(root, HOME),
        os.path.normpath(os.path.join(common, HOME)) if common else "",
    )


def home_name_in(read):
    """The name of the shared root in a tree read through READ, or "".

    READ takes a `/`-joined path relative to the repository's top and
    returns that file's text, or None where there is none: the working tree
    through `_on_disk` below, or a commit through a caller's own reader, as
    `chain_check.py` reads one. The answer is `HOME` where its `README.md`
    opens with `MARKER`, so the marker comparison has this one home for every
    reader.
    """
    return HOME if _opens_with_marker(read(f"{HOME}/{README}")) else ""


def home_name(root, common=None):
    """The `/`-joined repository-relative name of the root in force at
    `root` where it is the shared one, `HOME`; "" where the
    root is local or there is none.

    For a reader that classifies paths as git prints them, which needs the
    root's name in the tree and not its path on this disk.
    """
    if not home_at(root, common):
        return ""
    return home_name_in(_on_disk(root))


def _on_disk(root):
    """A reader of the working tree at `root` for `home_name_in`: the first
    line of the file at a `/`-joined relative path, read as `marked` reads
    it, or None where it cannot be read."""

    def read(rel):
        return _first_line(os.path.join(root, *rel.split("/")))

    return read


def _first_line(path):
    """The first line of the file at `path`, bounded at the marker's length
    and the two characters a line end can take, or None where it cannot be
    read: absent, a directory, or no file at all."""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.readline(len(MARKER) + 2)
    except OSError:
        return None


def _opens_with_marker(text):
    """True where TEXT's first line, its line end taken off, is `MARKER`;
    False for None."""
    if text is None:
        return False
    return text.split("\n", 1)[0].rstrip("\r") == MARKER


def marked(path):
    """True where `<path>/README.md` opens with `MARKER`.

    The first line is compared with its line end stripped, and nothing past
    it is read: the read is bounded at the marker's length and the two
    characters a line end can take, because every gated command pays for it,
    and a longer first line is not the marker anyway. A file that is absent
    or is a directory is not the marker, and neither is a first line that
    does not decode: `errors="replace"` turns its bytes into a character the
    marker does not hold, where a strict decode would also refuse a marked
    file for a stray byte further down the same buffered chunk. An empty
    path is no root: joined, it would name the README of whatever directory
    the process stands in.
    """
    if not path:
        return False
    return _opens_with_marker(_first_line(os.path.join(path, README)))


def home_at(root, common=None):
    """The `agentory/` of the repository at `root`, or "" — for a caller that has
    already resolved the root and should not pay for a second `git` call.

    The places are read in order, `<root>/agentory/`, then
    `<git-common-dir>/agentory/`, and the first that is a directory whose
    `README.md` opens with `MARKER` is the answer; nothing else is read. A
    `<root>/agentory/` without the marker is passed over, so a project that keeps
    a directory of that name for itself keeps no shared root, and its local
    root under the git directory. The opt-out is read once, here, so it
    cannot be honoured by one arm of a gate and missed by the other — the
    migration config sits inside the root the opt-out takes back, and a
    repository nobody reviews has nothing to compare against an original
    either.

    `common` is passed by a caller that needs the common git directory for
    something else too, so one invocation asks git for it once rather than
    once per unit that wants it — the same parameter, for the same reason, as
    `home_paths` above. From a linked worktree, where `.git` is a file and
    the fast path below does not apply, a gate that resolves the root, the
    opt-in and its own marker separately runs the same `rev-parse
    --git-common-dir` three times on every Bash call.
    """
    if not root:
        return ""
    # One `git_common_dir` call: the opt-out below needs the common directory
    # even when the shared root is the answer, so no path skips it, and asking
    # once is what lets the two places be produced in one place.
    if common is None:
        common = git_common_dir(root)
    # A FILE, which is what this module says the
    # signal is. `os.path.exists` would also accept a DIRECTORY of that name,
    # so a directory created where the opt-out goes would turn every
    # gate off with nothing in the diff that reads as the records being
    # switched off.
    if common and os.path.isfile(os.path.join(common, SCRATCH)):
        return ""
    for found in home_paths(root, common):
        if found and os.path.isdir(found) and marked(found):
            return found
    return ""


def home(cwd):
    """This repository's `agentory/`, or "" when it keeps no IADD records."""
    return home_at(repo_root(cwd))


def opted_in(cwd):
    """True when this repository keeps IADD records."""
    return bool(home(cwd))
