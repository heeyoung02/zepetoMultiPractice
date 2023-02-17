import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";

export default class extends Sandbox {

    // 룸이 생성될때 1회 호출
    onCreate(options: SandboxOptions) {
        console.log("OnCreate!!!!");
        this.onMessage?.("echo", (client, message) => {
            console.log(`Echo onMessage from ${client.sessionId}, -> ${message}`);

            // Send current client
            client.send("echo", "echo to sender : " + message);

            // Broadcast all connected client
            this.broadcast?.("echo", "echo to all : " + message);
        });
    }

    // 맵 자료구조 - 클라이언트 키 : sessionId, 값 : client
    private map = new Map<string, SandboxPlayer>();

    // 클라이언트가 룸에 입장할 때 호출
    onJoin(client: SandboxPlayer) {
        console.log(`OnJoin!!!!`);

        this.map.set(client.sessionId, client);
        console.log(this.map.size); // 룸에 접속한 클라이언트 수

    }

    // 클라이언트가 룸에서 퇴장할 때 호출
    onLeave(client: SandboxPlayer, consented?: boolean) {
        console.log(`OnLeave!!!!`);
        this.map.delete(client.sessionId);
        console.log(this.map.size);
    }

    // sendboxOption에서 설정된 tickInterval마다 반복적으로 호출
    onTick(deltaTime: number) {

    }
}