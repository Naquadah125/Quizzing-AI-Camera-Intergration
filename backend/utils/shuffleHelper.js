// Keeps pinned items at fixed indices while randomly shuffling remaining options
function shuffleOptionsWithPin(options) {
  if (!Array.isArray(options) || options.length <= 1) return options;

  const pinnedItems = [];
  const unpinnedItems = [];

  options.forEach((opt, idx) => {
    if (opt.isPinned) {
      pinnedItems.push({
        item: opt,
        position: opt.pinnedPosition !== null && opt.pinnedPosition !== undefined ? opt.pinnedPosition : idx,
      });
    } else {
      unpinnedItems.push(opt);
    }
  });

  for (let i = unpinnedItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unpinnedItems[i], unpinnedItems[j]] = [unpinnedItems[j], unpinnedItems[i]];
  }

  const result = new Array(options.length);

  pinnedItems.forEach(({ item, position }) => {
    const targetPos = Math.min(Math.max(position, 0), options.length - 1);
    result[targetPos] = item;
  });

  let unpinnedIndex = 0;
  for (let i = 0; i < result.length; i++) {
    if (!result[i]) {
      result[i] = unpinnedItems[unpinnedIndex++];
    }
  }

  return result;
}

module.exports = { shuffleOptionsWithPin };
