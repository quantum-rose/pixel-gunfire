const { spawn } = require('child_process');

function runCommand(command, args, options) {
    const child = spawn(command, args, { ...options });

    child.on('close', code => {
        if (code !== 0) {
            console.error(`Command ${command} ${args.join(' ')} exited with code ${code}`);
        }
    });
}

runCommand('pnpm', ['-F', '@pixel-gunfire/common', 'dev']);
runCommand('pnpm', ['-F', '@pixel-gunfire/server', 'dev'], { stdio: 'inherit' });
