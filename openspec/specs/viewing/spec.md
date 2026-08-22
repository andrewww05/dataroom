## Purpose

Answers what a caller is told about an item beyond its own row — today the recursive figures behind
a folder's details pane and the blast radius every delete has to state: how many folders, how many
files and how many bytes are inside it.

## Requirements

### Requirement: A node's contents are counted and totalled on demand

The API SHALL report, for one node, the number of folders, the number of files and the total bytes
**inside** it — its whole subtree at any depth, not merely its immediate children — computed in one
request rather than by walking the tree from the client (FR-ACCT-020). The figures SHALL describe the
contents and SHALL NOT count the node itself, so they can be read aloud as "this removes N folders
and M files (X bytes)" without arithmetic (BR-030). The figures SHALL be exact, never sampled,
estimated or capped, and SHALL be reported only when asked for — never attached to a listing row.

#### Scenario: FR-ACCT-020 a folder reports its whole subtree, not just its children

- **WHEN** the contents of a folder holding nested folders, and files several levels below it, are
  read
- **THEN** the folder count, file count and byte total cover every descendant at every depth

#### Scenario: FR-ACCT-020 the node itself is not counted

- **WHEN** the contents of a folder holding exactly one empty subfolder and one file are read
- **THEN** the answer is one folder and one file, not two folders — the folder asked about is the
  container, not part of what is inside it

#### Scenario: FR-ACCT-020 an empty folder reports zeros

- **WHEN** the contents of a folder with nothing in it are read
- **THEN** every figure is zero, and none is null, absent or negative

#### Scenario: FR-ACCT-020 a file reports nothing inside it

- **WHEN** the contents of a file are read
- **THEN** every figure is zero, because nothing is inside a file — not an error, and not the file's
  own size, which is already on the file's own row

#### Scenario: FR-ACCT-020 the byte total sums only files, at every depth

- **WHEN** the contents of a folder whose files sit at mixed depths are read
- **THEN** the byte total is the sum of every file in the subtree, folders contributing nothing

#### Scenario: FR-ACCT-020 a total beyond 32 bits is reported exactly

- **WHEN** the contents of a folder holding more than 4 GiB of files are read
- **THEN** the byte total is exact and is a plain JSON number, not a string, an object or a rounded
  value

#### Scenario: FR-ACCT-020 depth does not change the answer

- **WHEN** the same set of files is read once nested shallowly and once nested 32 levels deep
- **THEN** both answers are identical, and neither request fails on depth

#### Scenario: FR-ACCT-020 another Data Room's rows are never counted

- **WHEN** the contents of a folder are read while other Data Rooms hold folders and files of their
  own
- **THEN** the figures cover only the caller's own room

#### Scenario: FR-ACCT-020 the figures are never attached to a listing

- **WHEN** a folder's children are listed
- **THEN** no row carries recursive figures, so browsing never pays for a count nobody asked to see
