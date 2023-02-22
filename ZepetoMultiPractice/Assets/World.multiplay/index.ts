import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import { Player, Transform, Vector3 } from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {

    // 룸이 생성될때 1회 호출. 룸 초기화 로직 작성
    onCreate(options: SandboxOptions) {

        // 개별 클라이언트의 위치를 수신받는 메시지 리스너
        this.onMessage?.("onChangedTransform", (client, message) => {
            // transform이 변경된 player 불러오기
            const player = this.state.players.get(client.sessionId);

            // 받아온 위치 메시지를 담기 위해 transform객체 생성
            const transform = new Transform();
            transform.position = new Vector3();

            // 메시지에서 가져온 값 넣어주기
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            // 완성된 transform을 player의 transform에 저장하기
            //player.transform = transform;
            if (player != undefined)
                player.transform = transform;
        });

        // 클라이언트로부터 수신된 메세지를 확인하기 위해 콜백 등록
        this.onMessage?.("onChangedState", (client, message) => {
            // 메시지를 보낸 플레이어 정보 불러오기
            const player = this.state.players.get(client.sessionId);
            // 클라이언트에서 메세지에 state 타입으로 CharacterState를 전송했으므로 다음과 같이 저장
            //player.state = message.state;
            if (player != undefined)
                player.state = message.state;
        });
    }

    // 맵 자료구조 - 클라이언트 키 : sessionId, 값 : client
    //private map = new Map<string, SandboxPlayer>();

    // 클라이언트가 룸에 입장할 때 호출 (클라이언트의 ID 및 캐릭터 정보는 SandboxPlayer객체에 포함되어 있음)
    async onJoin(client: SandboxPlayer) {
        //this.map.set(client.sessionId, client);
        //console.log(this.map.size); // 룸에 접속한 클라이언트 수
        console.log(`[On Join] sessionID : ${client.sessionId}, HashCode : ${client.hashCode}, UserID : ${client.userId}`);

        // schema에 설정한 player 생성 - 클라이언트 정보 저장
        const player = new Player();
        player.sessionId = client.sessionId;
        if (client.hashCode)
            player.zepetoHash = client.hashCode;
        if (client.userId)
            player.zepetoUserId = client.userId;

        // 클라이언트의 방문 횟수를 데이터스토리지를 이용하여 저장 및 갱신
        const storage: DataStorage | undefined = client.loadDataStorage?.();
        if (storage != undefined) {
            let visitCnt = await storage.get("VisitCount") as number;
            if (visitCnt == null) visitCnt = 0;
            console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visitCnt}`);
            await storage.set("VisitCount", ++visitCnt);
        }

        this.state.players.set(client.sessionId, player); // RoomState에 정의했던 players에 저장.
    }

    // 클라이언트가 룸에서 퇴장할 때 호출 (consented는 클라이언트가 연결 해제를 요청한 경우 true, 그렇지 않으면 false로 설정됨)
    onLeave(client: SandboxPlayer, consented?: boolean) {
        // 퇴장한 player를 Room에서 관리하는 State의 players 목록에서 제거
        this.state.players.delete(client.sessionId);
    }

    // sendboxOption에서 설정된 tickInterval마다 반복적으로 호출
    onTick(deltaTime: number) {

    }
}