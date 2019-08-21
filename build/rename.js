const path = require('path')
const nodeFs = require('fs')
const { promises: fs } = nodeFs

main()

async function main() {
  const basedir = path.resolve(__dirname, '..', 'esm')
  const queue = await Promise.all(
    Array.from(await fs.readdir(basedir, 'utf8'), async name => {
      const renamed = name.replace(/\.js($|\.)/, '.mjs$1')
      if (renamed !== name) {
        return /** @type {[string,string]} */ ([
          path.resolve(basedir, name),
          path.resolve(basedir, renamed)
        ])
      }
    })
  )
  await Promise.all(
    queue.filter(Boolean).map(async ([name, renamed]) => {
      if (name.endsWith('.js')) {
        // update source map
        // this is good enough unless there are relative imports
        const text = await fs.readFile(name, 'utf8')
        await fs.writeFile(
          name,
          text.replace(
            /^\/\/# sourceMappingURL=(.*)\.js\.map$/m,
            '//# sourceMappingURL=$1.mjs.map'
          ),
          'utf8'
        )
      }
      await fs.rename(name, renamed)
    })
  )
}
