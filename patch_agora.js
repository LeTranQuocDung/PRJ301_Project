const fs = require('fs');

const patchFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove hardcoded AGORA_TOKEN
  content = content.replace(/const AGORA_TOKEN\s*=\s*['"`]00[a-zA-Z0-9+/=]+['"`]/g, "const AGORA_TOKEN = null; // Will fetch dynamically");

  // Update joinRoom logic
  const joinOld = `await clientRef.current.join(AGORA_APP_ID, AGORA_CHANNEL, AGORA_TOKEN, uid)`;
  const joinOld2 = `await clientRef.current.join(AGORA_APP_ID,AGORA_CHANNEL,AGORA_TOKEN,uid)`;
  
  const joinNew = `
      // Dynamic Token Fetching
      console.log('Fetching dynamic token for channel:', AGORA_CHANNEL);
      const resToken = await fetch(\`http://localhost:3000/api/agora/token?channelName=\${AGORA_CHANNEL}&uid=\${uid}\`);
      const dataToken = await resToken.json();
      if (!dataToken.token) throw new Error('Không lấy được Token từ Server');
      
      await clientRef.current.join(AGORA_APP_ID, AGORA_CHANNEL, dataToken.token, uid)`;

  if (content.includes(joinOld)) {
    content = content.replace(joinOld, joinNew.trim());
  } else if (content.includes(joinOld2)) {
    content = content.replace(joinOld2, joinNew.trim());
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched:', filePath);
};

patchFile('D:/PRJ301/PRJ301_Project_GitHub/src/AdminApp.jsx');
patchFile('D:/PRJ301/PRJ301_Project_GitHub/src/UserApp.jsx');
console.log('Agora Dynamic Token patching complete.');
