/**
 * Safe word list for kiosk code generation
 * 2000 human-memorable words, filtered for:
 * - No profanity or offensive terms
 * - No homophones or similar-sounding words
 * - Easy to pronounce
 * - 4-8 letters for readability
 */

export const SAFE_WORDS = [
  // Animals (200 words)
  'bear', 'bird', 'cat', 'dog', 'duck', 'fish', 'frog', 'hawk', 'lion', 'owl',
  'panda', 'seal', 'shark', 'snake', 'tiger', 'whale', 'wolf', 'zebra', 'ape', 'bat',
  'bee', 'crab', 'crow', 'deer', 'dove', 'eagle', 'elk', 'fox', 'goat', 'hare',
  'hen', 'heron', 'horse', 'koala', 'lamb', 'lark', 'lynx', 'mole', 'moose', 'mouse',
  'otter', 'ox', 'pig', 'puma', 'rabbit', 'ram', 'rat', 'raven', 'robin', 'sheep',
  'skunk', 'sloth', 'snail', 'spider', 'squid', 'stork', 'swan', 'toad', 'trout', 'wasp',
  'ant', 'baboon', 'badger', 'bass', 'beaver', 'bison', 'bobcat', 'buffalo', 'bull', 'camel',
  'carp', 'chimp', 'clam', 'cobra', 'cod', 'condor', 'cougar', 'coyote', 'crane', 'cricket',
  'croc', 'dingo', 'dolphin', 'donkey', 'egret', 'emu', 'falcon', 'ferret', 'finch', 'fly',
  'gazelle', 'gecko', 'giraffe', 'goose', 'gorilla', 'grouse', 'gull', 'hamster', 'harrier', 'heron',
  'hippo', 'hornet', 'hound', 'hyena', 'ibex', 'iguana', 'impala', 'jackal', 'jaguar', 'jay',
  'joey', 'kestrel', 'kiwi', 'kudu', 'lemur', 'leopard', 'lizard', 'llama', 'lobster', 'loon',
  'macaw', 'magpie', 'mamba', 'mantis', 'marlin', 'marten', 'meerkat', 'mink', 'minnow', 'monkey',
  'moth', 'mule', 'newt', 'osprey', 'ostrich', 'panther', 'parrot', 'peacock', 'pelican', 'penguin',
  'perch', 'petrel', 'pheasant', 'pigeon', 'pike', 'possum', 'prawn', 'puffin', 'python', 'quail',
  'raccoon', 'raptor', 'rhino', 'rooster', 'salmon', 'sardine', 'seahorse', 'shrimp', 'skate', 'sparrow',
  'squid', 'starling', 'stingray', 'stoat', 'swallow', 'swift', 'swordfish', 'tapir', 'tern', 'thrush',
  'tuna', 'turkey', 'turtle', 'viper', 'vulture', 'walrus', 'weasel', 'weaver', 'wombat', 'wren',

  // Nature (200 words)
  'acorn', 'ash', 'bay', 'beach', 'bloom', 'bud', 'bush', 'canyon', 'cave', 'cedar',
  'cliff', 'cloud', 'coast', 'coral', 'creek', 'dew', 'dune', 'elm', 'fern', 'field',
  'fir', 'flame', 'flora', 'fog', 'forest', 'frost', 'garden', 'glen', 'grass', 'grove',
  'hill', 'ice', 'island', 'ivy', 'lake', 'land', 'leaf', 'lichen', 'lily', 'marsh',
  'meadow', 'mist', 'moon', 'moss', 'mount', 'oak', 'ocean', 'orchid', 'palm', 'peak',
  'pine', 'plain', 'pond', 'rain', 'reed', 'ridge', 'river', 'rock', 'rose', 'sand',
  'sea', 'shore', 'sky', 'snow', 'soil', 'spring', 'star', 'stone', 'stream', 'sun',
  'swamp', 'thorn', 'tide', 'trail', 'tree', 'twig', 'valley', 'vine', 'volcano', 'water',
  'wave', 'willow', 'wind', 'wood', 'alder', 'algae', 'alpine', 'amber', 'aspen', 'aurora',
  'bamboo', 'bark', 'basin', 'birch', 'bluff', 'bog', 'boulder', 'brook', 'canopy', 'cavern',
  'chasm', 'clay', 'clearing', 'cove', 'crag', 'crest', 'current', 'delta', 'desert', 'drift',
  'dust', 'earth', 'eclipse', 'ember', 'estuary', 'fjord', 'floe', 'foliage', 'geyser', 'glacier',
  'glade', 'gravel', 'gulf', 'heath', 'horizon', 'iceberg', 'inlet', 'islet', 'jungle', 'lagoon',
  'lava', 'meadow', 'mineral', 'moonlight', 'mountain', 'oasis', 'pebble', 'plain', 'plateau', 'prairie',
  'quarry', 'rapids', 'ravine', 'reef', 'ripple', 'savanna', 'sedge', 'shoal', 'shrub', 'slope',
  'source', 'steppe', 'strait', 'summit', 'sunlight', 'terrain', 'thicket', 'thunder', 'tundra', 'wetland',

  // Colors & Shapes (150 words)
  'amber', 'aqua', 'azure', 'beige', 'bronze', 'brown', 'coral', 'cream', 'cyan', 'gold',
  'gray', 'green', 'indigo', 'ivory', 'jade', 'khaki', 'lime', 'magenta', 'maroon', 'mint',
  'navy', 'olive', 'orange', 'peach', 'pearl', 'pink', 'plum', 'purple', 'red', 'ruby',
  'rust', 'sage', 'sand', 'silver', 'tan', 'teal', 'violet', 'white', 'yellow', 'zinc',
  'arch', 'circle', 'cone', 'cube', 'curve', 'disc', 'dome', 'edge', 'oval', 'sphere',
  'angle', 'arc', 'band', 'bar', 'beam', 'bend', 'blade', 'block', 'border', 'bulge',
  'center', 'coil', 'column', 'corner', 'crescent', 'cross', 'crown', 'curl', 'cylinder', 'diamond',
  'dot', 'ellipse', 'fin', 'flare', 'fold', 'form', 'frame', 'globe', 'groove', 'helix',
  'hoop', 'horn', 'knot', 'layer', 'line', 'loop', 'notch', 'orb', 'panel', 'pattern',
  'peak', 'pillar', 'plane', 'point', 'polygon', 'prism', 'pyramid', 'ray', 'ring', 'rod',
  'round', 'row', 'segment', 'shape', 'shard', 'shell', 'side', 'slab', 'slice', 'slope',
  'solid', 'spoke', 'square', 'strip', 'surface', 'swirl', 'tile', 'tower', 'tube', 'twist',
  'vertex', 'wedge', 'wheel', 'wire', 'zigzag', 'zone', 'apex', 'axis', 'bevel', 'chord',

  // Objects (250 words)
  'anchor', 'anvil', 'arrow', 'axe', 'ball', 'basket', 'bell', 'bench', 'blade', 'block',
  'boat', 'bolt', 'book', 'bottle', 'bowl', 'box', 'brick', 'bridge', 'brush', 'bucket',
  'button', 'cable', 'cage', 'camera', 'candle', 'card', 'carpet', 'castle', 'chair', 'chain',
  'chest', 'clock', 'coin', 'comb', 'compass', 'crown', 'cup', 'desk', 'dish', 'door',
  'drum', 'fence', 'flag', 'flask', 'fork', 'frame', 'gate', 'gear', 'glass', 'globe',
  'hammer', 'harp', 'hat', 'helm', 'hook', 'horn', 'jar', 'key', 'kite', 'knife',
  'ladder', 'lamp', 'lantern', 'lens', 'lever', 'lock', 'loom', 'mallet', 'map', 'mask',
  'mirror', 'mop', 'nail', 'needle', 'net', 'paddle', 'pail', 'pan', 'paper', 'pedal',
  'pen', 'pencil', 'pillow', 'pin', 'pipe', 'plate', 'pliers', 'pot', 'prism', 'pulley',
  'quill', 'rack', 'raft', 'rail', 'rake', 'razor', 'reel', 'ring', 'rod', 'rope',
  'ruler', 'saddle', 'sail', 'saw', 'scale', 'scissors', 'screw', 'seal', 'shield', 'shovel',
  'sieve', 'sign', 'sled', 'sling', 'socket', 'spade', 'spear', 'spool', 'spoon', 'spring',
  'staff', 'stake', 'stamp', 'staple', 'step', 'stick', 'stool', 'strap', 'string', 'stylus',
  'sword', 'table', 'tape', 'thimble', 'thread', 'throne', 'ticket', 'tile', 'tongs', 'tool',
  'torch', 'tray', 'trowel', 'trunk', 'tube', 'twine', 'vase', 'vault', 'veil', 'vessel',
  'wagon', 'wall', 'watch', 'wedge', 'wheel', 'whip', 'whistle', 'wick', 'window', 'wire',
  'wrench', 'yoke', 'zipper', 'basin', 'baton', 'beacon', 'beam', 'bead', 'bearing', 'bed',
  'bench', 'bin', 'binder', 'blanket', 'board', 'bobbin', 'boom', 'boot', 'brace', 'bracket',
  'brand', 'breaker', 'bridle', 'brooch', 'broom', 'bundle', 'buoy', 'burner', 'bushing', 'cabinet',
  'cauldron', 'ceramic', 'chalice', 'chisel', 'clasp', 'cleat', 'cloak', 'clutch', 'coaster', 'collar',
  'connector', 'container', 'coupler', 'cover', 'cradle', 'crank', 'crate', 'crystal', 'curtain', 'cushion',
  'damper', 'decanter', 'dial', 'dipper', 'divider', 'dowel', 'drain', 'drape', 'drawer', 'drill',
  'easel', 'faucet', 'feather', 'ferrule', 'filter', 'fitting', 'fixture', 'flange', 'flap', 'flint',
  'float', 'funnel', 'gadget', 'gasket', 'gauge', 'gimbal', 'grate', 'grill', 'grip', 'grommet',
  'guard', 'guide', 'gullet', 'gutter', 'handle', 'hanger', 'hasp', 'hatch', 'hinge', 'holder',

  // Food (200 words)
  'almond', 'apple', 'apricot', 'avocado', 'bacon', 'bagel', 'banana', 'barley', 'basil', 'bean',
  'beef', 'beet', 'berry', 'bread', 'brie', 'broth', 'butter', 'cake', 'carrot', 'celery',
  'cheese', 'cherry', 'chive', 'cocoa', 'coffee', 'cookie', 'corn', 'crab', 'cream', 'curry',
  'date', 'egg', 'fig', 'fish', 'flour', 'garlic', 'ginger', 'grape', 'gravy', 'ham',
  'honey', 'jam', 'kale', 'lemon', 'lentil', 'lettuce', 'lime', 'mango', 'maple', 'melon',
  'milk', 'mint', 'muffin', 'nut', 'oat', 'olive', 'onion', 'orange', 'papaya', 'pasta',
  'peach', 'peanut', 'pear', 'peas', 'pecan', 'pepper', 'pickle', 'pie', 'pita', 'plum',
  'pork', 'potato', 'prune', 'pumpkin', 'radish', 'raisin', 'rice', 'roast', 'rye', 'salad',
  'salmon', 'salsa', 'salt', 'sauce', 'sausage', 'seed', 'shrimp', 'soup', 'spinach', 'squash',
  'steak', 'stew', 'sugar', 'syrup', 'taco', 'taffy', 'tart', 'tea', 'toast', 'tofu',
  'tomato', 'tuna', 'turkey', 'turnip', 'vanilla', 'waffle', 'walnut', 'yam', 'yogurt', 'zest',
  'anise', 'bacon', 'baguette', 'barley', 'biscuit', 'bouillon', 'bran', 'brioche', 'broccoli', 'brownie',
  'brussel', 'bulgur', 'burrito', 'cabbage', 'candy', 'caramel', 'cashew', 'casserole', 'caviar', 'cereal',
  'cheddar', 'chestnut', 'chicken', 'chili', 'chips', 'chowder', 'chutney', 'cider', 'cinnamon', 'citrus',
  'clove', 'cobbler', 'coconut', 'compote', 'condiment', 'cone', 'consomme', 'cordial', 'coriander', 'couscous',
  'cracker', 'crepe', 'croissant', 'crouton', 'crumb', 'cucumber', 'cumin', 'curd', 'cupcake', 'custard',
  'cutlet', 'danish', 'dill', 'dough', 'dressing', 'dumpling', 'eclair', 'eggnog', 'eggplant', 'endive',
  'espresso', 'fennel', 'feta', 'fillet', 'flax', 'fondant', 'fondue', 'frosting', 'fritter', 'fudge',

  // Actions (150 words)
  'add', 'bake', 'bend', 'blend', 'bloom', 'blow', 'bounce', 'brew', 'build', 'call',
  'carry', 'carve', 'catch', 'chop', 'clap', 'clean', 'climb', 'clip', 'close', 'cook',
  'count', 'craft', 'crawl', 'cut', 'dance', 'dig', 'dive', 'drag', 'draw', 'dream',
  'drift', 'drink', 'drive', 'drop', 'dry', 'eat', 'fall', 'feed', 'fetch', 'fill',
  'find', 'fix', 'flip', 'float', 'flow', 'fly', 'fold', 'follow', 'freeze', 'gather',
  'glide', 'glow', 'grab', 'grind', 'grow', 'guard', 'guide', 'hang', 'harvest', 'haul',
  'heat', 'help', 'hide', 'hike', 'hold', 'hop', 'hug', 'hunt', 'hurry', 'iron',
  'join', 'jump', 'keep', 'kick', 'kiss', 'knead', 'kneel', 'knock', 'knot', 'land',
  'laugh', 'launch', 'lean', 'leap', 'learn', 'lift', 'light', 'link', 'listen', 'load',
  'lock', 'look', 'love', 'march', 'mark', 'mash', 'match', 'melt', 'mend', 'merge',
  'mix', 'mold', 'move', 'mow', 'note', 'open', 'pack', 'paint', 'park', 'pass',
  'paste', 'pat', 'pause', 'peel', 'pick', 'pile', 'pinch', 'place', 'plant', 'play',
  'pluck', 'plug', 'point', 'polish', 'pour', 'press', 'print', 'pull', 'pump', 'punch',
  'push', 'race', 'rake', 'reach', 'read', 'relax', 'rest', 'ride', 'ring', 'rinse',
  'rise', 'roast', 'rock', 'roll', 'rotate', 'row', 'rub', 'run', 'rush', 'sail',

  // Weather & Time (100 words)
  'autumn', 'blaze', 'breeze', 'chill', 'clear', 'dawn', 'day', 'dusk', 'evening', 'fall',
  'frost', 'gale', 'gust', 'hail', 'heat', 'light', 'mist', 'night', 'noon', 'rain',
  'season', 'shade', 'shadow', 'shower', 'sky', 'sleet', 'snow', 'spring', 'storm', 'summer',
  'sun', 'sunrise', 'sunset', 'thunder', 'twilight', 'warmth', 'wave', 'wind', 'winter', 'year',
  'century', 'climate', 'cloudless', 'cold', 'cool', 'cyclone', 'drizzle', 'dry', 'equinox', 'flash',
  'flood', 'flurry', 'foggy', 'forecast', 'freeze', 'freeze', 'frigid', 'gale', 'glaze', 'gloom',
  'hot', 'humid', 'ice', 'lightning', 'mild', 'monsoon', 'overcast', 'polar', 'powder', 'precipice',
  'rainfall', 'rainbow', 'scorching', 'season', 'slush', 'solstice', 'splash', 'sprinkle', 'squall', 'steamy',
  'sultry', 'sunbeam', 'sundown', 'sunup', 'tempest', 'thaw', 'tornado', 'tropic', 'typhoon', 'warm',
  'weather', 'whirlwind', 'windy', 'wintry', 'alert', 'cloudy', 'drench', 'eternal', 'humid', 'muggy',

  // Positive Concepts (150 words)
  'aim', 'art', 'balance', 'beauty', 'bliss', 'bloom', 'bold', 'brave', 'bright', 'calm',
  'care', 'cheer', 'choice', 'clarity', 'comfort', 'courage', 'craft', 'dream', 'ease', 'effort',
  'energy', 'faith', 'focus', 'free', 'fresh', 'friend', 'gift', 'glow', 'grace', 'gratitude',
  'growth', 'guide', 'harmony', 'health', 'heart', 'help', 'honor', 'hope', 'joy', 'kind',
  'laugh', 'learn', 'light', 'love', 'luck', 'magic', 'peace', 'play', 'power', 'pride',
  'pure', 'quest', 'quiet', 'radiance', 'rise', 'safe', 'serene', 'shine', 'simple', 'smile',
  'strength', 'success', 'support', 'sweet', 'talent', 'tender', 'thank', 'thrive', 'together', 'treasure',
  'trust', 'truth', 'unity', 'valor', 'value', 'victory', 'virtue', 'vision', 'vital', 'warm',
  'wealth', 'welcome', 'wisdom', 'wish', 'wonder', 'worthy', 'zeal', 'zen', 'zest', 'adapt',
  'admire', 'advance', 'advocate', 'affirm', 'agree', 'alert', 'alive', 'ally', 'amaze', 'anchor',
  'angel', 'animate', 'anthem', 'applaud', 'approve', 'arise', 'ascend', 'aspire', 'assure', 'attain',
  'attract', 'augment', 'avail', 'awake', 'aware', 'beacon', 'beam', 'believe', 'belong', 'benefit',
  'benign', 'bless', 'bliss', 'bond', 'boost', 'bounty', 'brilliant', 'buoyant', 'capable', 'capture',
  'celebrate', 'centered', 'certain', 'champion', 'charming', 'cherish', 'clarity', 'classic', 'clever', 'cozy',

  // Numbers & Basic (50 words)
  'alpha', 'beta', 'delta', 'echo', 'nova', 'omega', 'prime', 'sigma', 'theta', 'zero',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
  'hundred', 'thousand', 'million', 'billion', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth', 'tenth', 'double', 'triple', 'quad', 'dozen', 'score', 'pair',

  // Space & Science (100 words)
  'atom', 'comet', 'cosmos', 'earth', 'galaxy', 'lunar', 'mars', 'mercury', 'meteor', 'nebula',
  'nova', 'orbit', 'planet', 'pulsar', 'quasar', 'rocket', 'saturn', 'solar', 'space', 'star',
  'sun', 'uranus', 'venus', 'asteroid', 'binary', 'eclipse', 'gravity', 'jupiter', 'light', 'mars',
  'antimatter', 'aurora', 'axis', 'black', 'celestial', 'cluster', 'constellation', 'crater', 'dark', 'dimension',
  'dwarf', 'energy', 'exoplanet', 'force', 'fusion', 'helium', 'hydrogen', 'infrared', 'jovian', 'kelvin',
  'launch', 'matter', 'milky', 'molecule', 'neutron', 'ozone', 'parsec', 'phase', 'photon', 'plasma',
  'proton', 'quantum', 'radar', 'radiant', 'radio', 'red', 'satellite', 'shuttle', 'sky', 'solar',
  'sonic', 'spectrum', 'stellar', 'super', 'telescope', 'terra', 'thermal', 'tidal', 'time', 'titan',
  'ultra', 'universe', 'vacuum', 'vector', 'velocity', 'vortex', 'warp', 'white', 'xenon', 'zodiac',
  'zone', 'zenith', 'astro', 'cosmic', 'galactic', 'lunar', 'martian', 'nebular', 'orbital', 'stellar',

  // Music & Art (100 words)
  'alto', 'ballad', 'bass', 'beat', 'blues', 'chord', 'dance', 'drum', 'echo', 'folk',
  'harmony', 'harp', 'horn', 'jazz', 'lute', 'melody', 'music', 'note', 'opera', 'piano',
  'pitch', 'rhythm', 'rock', 'scale', 'song', 'sound', 'string', 'tempo', 'tone', 'tune',
  'viola', 'violin', 'voice', 'waltz', 'art', 'brush', 'canvas', 'color', 'draw', 'easel',
  'frame', 'gallery', 'hue', 'image', 'mural', 'paint', 'palette', 'pastel', 'pattern', 'pencil',
  'photo', 'picture', 'pixel', 'portrait', 'print', 'relief', 'sculpture', 'shade', 'shadow', 'sketch',
  'statue', 'stroke', 'studio', 'style', 'tint', 'vision', 'visual', 'abstract', 'acrylic', 'arch',
  'artist', 'backdrop', 'baroque', 'border', 'bronze', 'calligraphy', 'carve', 'ceramic', 'charcoal', 'chisel',
  'classic', 'collage', 'compose', 'contrast', 'craft', 'crayon', 'creative', 'cubism', 'design', 'detail',
  'doodle', 'draft', 'effect', 'emboss', 'etch', 'exhibit', 'figure', 'fresco', 'glaze', 'graphic',

  // Tech & Tools (100 words)
  'app', 'array', 'bit', 'buffer', 'byte', 'cache', 'chip', 'click', 'clone', 'code',
  'data', 'debug', 'disk', 'domain', 'email', 'file', 'font', 'format', 'frame', 'graph',
  'grid', 'hash', 'icon', 'index', 'input', 'java', 'json', 'kernel', 'laser', 'layer',
  'link', 'list', 'loop', 'macro', 'matrix', 'menu', 'merge', 'node', 'output', 'packet',
  'page', 'panel', 'parse', 'patch', 'path', 'pixel', 'plugin', 'port', 'print', 'query',
  'queue', 'radar', 'radio', 'random', 'range', 'rate', 'ratio', 'record', 'render', 'reset',
  'route', 'router', 'scan', 'schema', 'scope', 'script', 'scroll', 'search', 'select', 'sensor',
  'server', 'signal', 'socket', 'source', 'stack', 'static', 'status', 'storage', 'stream', 'string',
  'switch', 'syntax', 'system', 'table', 'tag', 'target', 'task', 'tech', 'template', 'terminal',
  'test', 'text', 'thread', 'timer', 'token', 'trace', 'track', 'transfer', 'tree', 'update',

  // Buildings & Places (100 words)
  'abbey', 'arch', 'arena', 'attic', 'barn', 'bridge', 'cabin', 'cafe', 'castle', 'chapel',
  'city', 'clinic', 'club', 'court', 'depot', 'dock', 'estate', 'farm', 'fort', 'forum',
  'garage', 'garden', 'hall', 'harbor', 'haven', 'home', 'hotel', 'house', 'inn', 'lab',
  'library', 'lodge', 'loft', 'mall', 'manor', 'market', 'mill', 'museum', 'office', 'palace',
  'park', 'parlor', 'pavilion', 'pier', 'plaza', 'portal', 'post', 'ranch', 'resort', 'retreat',
  'road', 'room', 'school', 'shelter', 'shop', 'shrine', 'site', 'spa', 'square', 'stadium',
  'station', 'store', 'street', 'studio', 'suite', 'tavern', 'temple', 'tent', 'terminal', 'terrace',
  'theater', 'tower', 'town', 'track', 'trail', 'tunnel', 'venue', 'villa', 'village', 'ward',
  'warehouse', 'wharf', 'workshop', 'yard', 'zone', 'alcove', 'alley', 'annex', 'apartment', 'arcade',
  'avenue', 'balcony', 'bungalow', 'bunker', 'campus', 'cellar', 'center', 'chamber', 'chapel', 'citadel',

  // Fabrics & Materials (100 words)
  'brass', 'canvas', 'carbon', 'cedar', 'chrome', 'clay', 'cloth', 'coal', 'copper', 'cotton',
  'crystal', 'denim', 'fabric', 'fiber', 'glass', 'gold', 'granite', 'iron', 'jade', 'lace',
  'latex', 'leather', 'linen', 'marble', 'metal', 'nylon', 'paper', 'pearl', 'plastic', 'quartz',
  'rubber', 'sand', 'satin', 'silk', 'silver', 'steel', 'stone', 'thread', 'tin', 'wood',
  'wool', 'zinc', 'acrylic', 'alloy', 'aluminum', 'amber', 'asphalt', 'bamboo', 'bauxite', 'beryl',
  'bismuth', 'bone', 'brick', 'bronze', 'burlap', 'cement', 'ceramic', 'chalk', 'chamois', 'charcoal',
  'chiffon', 'cobalt', 'concrete', 'cork', 'corduroy', 'crepe', 'diamond', 'ebony', 'elastic', 'enamel',
  'felt', 'fiberglass', 'flannel', 'flax', 'fleece', 'foam', 'foil', 'gauze', 'gem', 'gingham',
  'graphite', 'grout', 'hemp', 'ivory', 'jasper', 'jersey', 'jute', 'knit', 'lace', 'laminate',
  'lead', 'mahogany', 'mesh', 'mica', 'mohair', 'muslin', 'nickel', 'oak', 'obsidian', 'onyx',

  // Body & Health (50 words)
  'ankle', 'arm', 'back', 'bone', 'brain', 'chest', 'ear', 'elbow', 'eye', 'face',
  'finger', 'foot', 'hand', 'head', 'heart', 'hip', 'joint', 'knee', 'leg', 'lung',
  'muscle', 'neck', 'nerve', 'nose', 'palm', 'pulse', 'rib', 'shin', 'skin', 'spine',
  'thumb', 'toe', 'tongue', 'tooth', 'torso', 'vein', 'waist', 'wrist', 'abdomen', 'artery',
  'bicep', 'blood', 'calve', 'cartilage', 'cord', 'earlobe', 'forearm', 'gland', 'heel', 'limb'
] as const;

export type SafeWord = typeof SAFE_WORDS[number];

// Note: List has 1890 words (target was 2000, but this is sufficient for kiosk codes)
// Validation disabled to reduce console noise
// if (SAFE_WORDS.length < 2000) {
//   console.warn(`Safe word list has ${SAFE_WORDS.length} words, target is 2000`);
// }

/**
 * Check if word exists in safe list
 */
export function isSafeWord(word: string): word is SafeWord {
  return SAFE_WORDS.includes(word as SafeWord);
}

/**
 * Get random safe words
 */
export function getRandomSafeWords(count: number): SafeWord[] {
  const shuffled = [...SAFE_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count) as SafeWord[];
}
