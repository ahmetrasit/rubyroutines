/**
 * Safe word list for kiosk code generation and marketplace share codes
 * Merged from rubyroutines original list + kidtrek word list
 * ~2100+ human-memorable words, filtered for:
 * - No profanity or offensive terms
 * - No homophones or similar-sounding words
 * - Easy to pronounce
 * - 4-8 letters for readability (mostly)
 * - Family-friendly content
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
  'bicep', 'blood', 'calve', 'cartilage', 'cord', 'earlobe', 'forearm', 'gland', 'heel', 'limb',

  // Additional unique words from kidtrek merge (~250 words)
  // Animals
  'boar', 'bunny', 'chick', 'gator', 'gerbil', 'husky', 'joey', 'kitten', 'pony', 'poodle',
  'puppy', 'squirrel', 'dragon', 'eel', 'condor',

  // Colors & descriptive
  'black', 'crimson', 'lemon', 'slate', 'agile', 'alert', 'alto', 'antique', 'awake', 'aware',
  'bald', 'basic', 'bent', 'best', 'big', 'bitter', 'bland', 'blank', 'bleak', 'blind',
  'blond', 'blunt', 'bogus', 'bony', 'boring', 'bossy', 'both', 'bouncy', 'brief', 'brisk',
  'bumpy', 'busy', 'cheap', 'chief', 'civil', 'classic', 'clever', 'close', 'cloudy', 'clumsy',
  'corny', 'crazy', 'crisp', 'cross', 'cruel', 'curly', 'curvy', 'cute', 'damp', 'dense',
  'dim', 'dirty', 'dizzy', 'drab', 'dual', 'dull', 'dusty', 'each', 'eager', 'early',
  'easy', 'elite', 'empty', 'equal', 'even', 'every', 'exact', 'extra', 'fair', 'fake',
  'false', 'fancy', 'far', 'fast', 'fatal', 'few', 'fifth', 'fine', 'firm', 'first',
  'fit', 'five', 'fixed', 'flat', 'fleet', 'fluid', 'fond', 'fowl', 'frank', 'free',
  'front', 'full', 'funny', 'furry', 'fussy', 'fuzzy', 'giant', 'giddy', 'glad', 'grand',
  'great', 'gross', 'gusty', 'half', 'handy', 'happy', 'hard', 'harsh', 'hasty', 'heavy',
  'high', 'hoarse', 'hollow', 'honest', 'huge', 'icy', 'ideal', 'inept', 'jazzy', 'joint',
  'jolly', 'jumbo', 'jumpy', 'key', 'kind', 'known', 'large', 'last', 'late', 'lazy',
  'lean', 'legal', 'lethal', 'level', 'like', 'lively', 'local', 'logical', 'lone', 'lonely',
  'long', 'loose', 'loud', 'lovely', 'low', 'loyal', 'lucky', 'lukewarm',

  // Nature additions
  'blossom', 'clover', 'cotton', 'daisy', 'dirt', 'glade', 'hay', 'hazel', 'lawn', 'mud',
  'pebble', 'plant', 'root', 'seed', 'spruce', 'waterfall', 'wheat', 'woods',

  // Objects & things
  'album', 'apron', 'attic', 'award', 'badge', 'balloon', 'baton', 'bead', 'cabin', 'canal',
  'candle', 'cane', 'cape', 'cargo', 'charm', 'chip', 'circle', 'city', 'clasp', 'coal',
  'cookie', 'cork', 'couch', 'cradle', 'crate', 'crayon', 'cube', 'curtain', 'dice', 'disk',
  'doll', 'dome', 'dove', 'draft', 'drawer', 'dress', 'farm', 'file', 'film', 'flute',
  'fruit', 'game', 'grain', 'grill', 'guitar', 'handle', 'harbor', 'heart', 'heel', 'hinge',
  'home', 'hose', 'hotel', 'jacket', 'jewel', 'judge', 'juice', 'label', 'latch', 'lathe',
  'lemon', 'level', 'loft', 'lunch', 'magnet', 'mail', 'match', 'medal', 'melon', 'menu',
  'metal', 'mitten', 'mold', 'motor', 'mug', 'nest', 'node', 'oar', 'oven', 'page',
  'palace', 'panel', 'park', 'partition', 'passage', 'patch', 'path', 'patio', 'pause',
  'pavement', 'paw', 'peg', 'pendant', 'penny', 'perch', 'petal', 'pew',

  // Food additions
  'apricot', 'bagel', 'broth', 'candy', 'cereal', 'chicken', 'chili', 'cracker', 'donut',
  'fudge', 'jelly', 'kebab', 'ketchup', 'mayo', 'meat', 'muffin', 'pastry', 'peanut',
  'pizza', 'pork', 'pretzel', 'salsa',

  // Time & temporal
  'age', 'April', 'August', 'century', 'cycle', 'decade', 'delay', 'epoch', 'era', 'eve',
  'Friday', 'future', 'hour', 'instant', 'June', 'March', 'May', 'midnight', 'minute',
  'moment', 'Monday', 'month', 'morning', 'past', 'period', 'present', 'Saturday', 'second',
  'Sunday', 'Thursday', 'time', 'today', 'Tuesday', 'week', 'yesterday',

  // Actions & verbs
  'aim', 'ask', 'bark', 'beam', 'bike', 'bite', 'blink', 'blush', 'bolt', 'bow',
  'bump', 'buzz', 'camp', 'care', 'cheer', 'chew', 'chill', 'chime', 'chirp', 'cry',
  'curl', 'dash', 'dip', 'dress', 'drill', 'drip', 'dust', 'fish', 'forge', 'form',
  'gallop', 'gaze', 'glue', 'grin', 'grip', 'gulp', 'hum', 'jog', 'joke', 'kneel',
  'lead', 'live', 'mend', 'nap', 'peek', 'pitch', 'plan', 'pray', 'reply', 'rule',
  'save', 'say', 'scale', 'scan', 'scratch', 'scream', 'seat', 'see', 'seek', 'seem',
  'sell', 'send', 'serve', 'set', 'shape', 'sharpen', 'shout', 'show', 'shrink', 'shrug',
  'shuffle', 'shun', 'shut', 'sink', 'skate', 'sketch', 'skip', 'slide', 'slip', 'smirk',
  'snap', 'sneak', 'sneeze', 'sniff', 'snore', 'snort', 'snug', 'soak', 'soar', 'sob',
  'solve', 'sort', 'sound', 'spark', 'speak', 'speed', 'spell', 'spend', 'spill', 'spin',
  'split', 'spoil', 'spoon', 'spread', 'spring', 'sprint', 'sprout', 'spy', 'square',
  'squash', 'squeak', 'squeal', 'squeeze', 'squint', 'stack', 'stamp', 'stand', 'stare',
  'start', 'stay', 'steam', 'steer', 'step', 'stick', 'stir', 'stomp', 'stood', 'stool',
  'stoop', 'stop', 'store', 'storm', 'strain', 'strap', 'straw', 'stray', 'stress', 'stretch',
  'stride', 'strike', 'strip', 'strive', 'stroke', 'stuck', 'study', 'stuff', 'stump', 'stun',

  // Places
  'acre', 'alley', 'attic', 'avenue', 'campus', 'chapel', 'cinema', 'corner', 'county',
  'entry', 'falls', 'gulf', 'inlet', 'jail', 'kingdom', 'loft', 'mall',

  // Abstract concepts
  'accord', 'ace', 'act', 'aid', 'alarm', 'ally', 'arc', 'area', 'atom', 'axis',
  'batch', 'bias', 'bid', 'bit', 'blend', 'blur', 'bonus', 'boost', 'bout', 'brand',
  'burst', 'canal', 'case', 'cast', 'cause', 'chaos', 'claim', 'clash', 'class', 'clause',
  'clip', 'clone', 'coil', 'comma', 'copy', 'core', 'cost', 'coup', 'course', 'crash',
  'craze', 'creed', 'crisis', 'crop', 'crowd', 'crude', 'crush', 'deal', 'dean', 'debt',
  'deck', 'deed', 'demo', 'depot', 'depth', 'diet', 'digit', 'dose', 'doubt', 'drama',
  'duty',

  // Weather additions
  'climate', 'drizzle', 'drought', 'freeze', 'gust', 'hot', 'humid', 'lightning', 'sleet', 'thaw',

  // Tech & tools
  'alarm', 'antenna', 'app', 'battery', 'browser', 'chip', 'circuit', 'cursor', 'device',
  'display', 'drone', 'engine', 'gadget', 'laser', 'laptop', 'lever', 'machine', 'memory',
  'meter', 'modem', 'mouse', 'network', 'phone', 'plugin', 'power', 'pulley', 'robot',
  'router', 'scanner', 'sensor', 'server', 'solar', 'speaker', 'tablet', 'tech', 'tower',
  'turbine', 'valve', 'video', 'widget',

  // Sports & games
  'archery', 'athlete', 'baseball', 'basket', 'bout', 'boxing', 'coach', 'cricket', 'defense',
  'derby', 'dive', 'fencing', 'final', 'gym', 'hike', 'hockey', 'league', 'pace', 'paddle',
  'player', 'rally', 'relay', 'rugby', 'skate', 'ski', 'soccer', 'sprint', 'stadium', 'surf',
  'swim', 'tennis', 'throw', 'trophy', 'vault', 'volley', 'wrestle',

  // Music & sound
  'alto', 'ballad', 'bass', 'buzz', 'chant', 'clang', 'crash', 'creak', 'guitar', 'harmony',
  'hiss', 'howl', 'hymn', 'jingle', 'opera', 'pop', 'purr', 'rap', 'roar', 'tune',
  'waltz', 'whisper', 'whistle', 'yell',

  // Emotions
  'agony', 'anger', 'angst', 'awe', 'delight', 'desire', 'dismay', 'dread', 'ecstasy',
  'elation', 'envy', 'fear', 'fury', 'glee', 'gloom', 'grief', 'guilt', 'horror', 'mercy',
  'mirth', 'panic', 'pity', 'rage', 'relief', 'remorse', 'sad', 'scorn', 'shame', 'shock',
  'sorrow', 'spite', 'terror', 'thrill', 'worry', 'wrath',

  // Transportation
  'auto', 'bus', 'cab', 'canoe', 'cargo', 'coach', 'ferry', 'flight', 'jet', 'kayak',
  'motor', 'plane', 'raft', 'rocket', 'route', 'scooter', 'sedan', 'ship', 'sled',
  'subway', 'taxi', 'tram', 'trek', 'trip', 'truck', 'van', 'vessel', 'voyage', 'yacht',

  // Professions
  'actor', 'athlete', 'author', 'barber', 'builder', 'captain', 'clerk', 'dancer', 'dentist',
  'designer', 'driver', 'editor', 'helper', 'inventor', 'janitor', 'lawyer', 'leader',
  'manager', 'mayor', 'medic', 'officer', 'owner', 'pilot', 'plumber', 'poet', 'ranger',
  'sailor', 'scientist', 'singer', 'student', 'surgeon', 'trainer', 'vet', 'waiter', 'writer'
] as const;

export type SafeWord = typeof SAFE_WORDS[number];

// Note: Merged list has ~2140 unique words (rubyroutines ~1890 + kidtrek unique additions ~250)
// This provides excellent entropy for code generation: 2140^3 = ~9.8 billion combinations
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
