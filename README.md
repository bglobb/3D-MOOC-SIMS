The purpose of this branch is to remove certain objects that cause clutter when overlapping frames of the simulation, so this branch should be used when stacking frames.
This branch should be identical to the master branch except that some objects will have their sizes set to 0.
Any commits to the master branch must also be commited here unless there's a good reason to not do so.

So far, this branch has the sizes of the current loop (lines 176 and 177 of sge_engine.js) and field axis (line 187 of sge_engine.js) set to 0. Any future commits to sge_engine.js to change the sizes of objects to 0 to make them disappear must be specified in the commit description.
