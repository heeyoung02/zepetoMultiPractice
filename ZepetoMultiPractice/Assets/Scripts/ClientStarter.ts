import { CharacterState, SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { Player, State, Vector3 } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import * as UnityEngine from 'UnityEngine';

export default class ClientStarter extends ZepetoScriptBehaviour {

    public multiPlay: ZepetoWorldMultiplay;
    private room: Room;

    // 클라이언트 고유값인 sessionID로 player객체를 저장할것이기 때문에 key - string / value - Player
    private currentPlayers: Map<string, Player> = new Map<string, Player>();

    Start() {
        // 룸이 생성되고 접속 가능할때 호출. 룸을 인자로 전달
        this.multiPlay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        // 룸에 접속되면 호출. 룸을 인자로 전달
        this.multiPlay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        }

        this.StartCoroutine(this.SendMessageLoop(0.1));

    }

    private OnStateChange(state: State, isFirst: bool) {
        // 제페토 플레이어스 이벤트 리스너 등록(처음 한번만 등록하면 됨)
        if (isFirst) {
            // LocalPlayer 인스턴스가 Scene에 완전히 로드되었을때 호출
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
                // character는 플레이에서 동적으로 생성된 실제 CharacterController가 포함된 오브젝트임. cur는 CharacterState타입임
                myPlayer.character.OnChangedState.AddListener((cur, prev) => {
                    // 이벤트가 발생할 때 마다 캐릭터 State를 서버로 전송하기 위한 함수
                    this.SendState(cur);
                });
            });

            // 다른 캐릭터 위치 전송받기
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                // 로컬플레이어가 아닌 경우에만 업데이트
                const isLocal = this.room.SessionId === sessionId;
                if (!isLocal) {
                    const player: Player = this.currentPlayers.get(sessionId);
                    player.OnChange += (ChangeValues) => this.OnUpdatePlayer(sessionId, player);
                }
            });
        }

        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);

        // RoomState에 저장되어 있는 플레이어 정보들 조회 (ForEach 메소드는 배열 요소를 하나씩 순회하며 콜백 함수를 실행한다)
        state.players.ForEach((sessionId: string, player: Player) => {
            // currentPlayers가 인자로 들어온 client의 sessionId를 가지고 있지 않다면, 지금 입장한 플레이어이므로 set으로 join에 등록
            if (!this.currentPlayers.has(sessionId))
                join.set(sessionId, player);
            // 퇴장한 플레이어만 leave에 남도록 함
            leave.delete(sessionId);
        });

        // Room에 새로운 플레이어가 입장할 때 이벤트를 받을 수 있게 player 객체에 OnJoinPlayer 이벤트 연결
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // Room에서 퇴장한 모든 player 인스턴스를 제거
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayers(sessionId, player));
    }

    private OnJoinPlayer(sessionId: string, player: Player) {
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        // 룸에 입장한 플레이어 관리를 위해 지금 입장한 플레이어를 currentPlayers에 등록
        this.currentPlayers.set(sessionId, player);
        // 플레이어 인스턴스 초기 Transform 설정을 위해 spawnInfo 객체를 생성
        const spawnInfo = new SpawnInfo();
        // position과 rotation 값 설정
        const position = new UnityEngine.Vector3(0, 0, 0);
        const rotation = new UnityEngine.Vector3(0, 0, 0);
        // spawnInfo에 설정한 position과 rotation값 설정
        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);
        // 플레이어 인스턴스 생성함수를 호출하기 전 isLocal상수를 선언하여 값 설정
        const isLocal = this.room.SessionId === player.sessionId; // ===는 일치 연산자로 값과 데이터 타입 모두 일치하는경우 true 반환

        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    // 플레이어 퇴장 로직
    private OnLeavePlayers(sessionId: string, player: Player) {
        console.log(`[OnLeave] players - sessionId : ${sessionId}`);
        // 퇴장한 플레이어 currentPlayers목록에서 제거하기
        this.currentPlayers.delete(sessionId);
        // 플레이어 인스턴스 제거
        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private OnUpdatePlayer(sessionId: string, player: Player) {
        // 포지션값 받아오기
        const position = this.ParseVector3(player.transform.position);
        // 위치를 업데이트할 플레이어 받아오기
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        // 캐릭터 위치 이동시키기
        zepetoPlayer.character.MoveToPosition(position);
        // 점프 동기화
        if (player.state === CharacterState.JumpIdle || player.state === CharacterState.JumpMove)
            zepetoPlayer.character.Jump();
    }

    private SendState(state: CharacterState) {
        // 서버에 전송할 데이터 타입
        const data = new RoomData();
        // 현재 캐릭터의 State 추가 (CharacterState는 ZEPETO.Character.Controller에 정의된 enum타입이다.)
        //enum CharacterState { Invalid = 0, Idle = 1, Walk = 2, Run = 3, JumpIdle = 4, JumpMove = 5, Teleport = 20, Gesture = 30, Move = 102, MoveTurn = 103, Jump = 104, Stamp = 106, Falling = 108, Landing = 109 }
        data.Add("state", state);
        // 클라이언트에서 서버로 메세지를 송신하는 함수
        this.room.Send("onChangedState", data.GetObject());
    }

    private SendTransform(transform: UnityEngine.Transform) {
        const data = new RoomData();

        // position 값을 넣어줄 룸데이터 객체
        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());

        // rotation 값을 넣어줄 룸데이터 객체
        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());

        // data메세지 전송 (위와같은 방식으로 직접 정의한 캐릭터 상태와 인벤토리 설정 등의 정보도 전달 가능)
        this.room.Send("onChangedTransform", data.GetObject());
    }

    private * SendMessageLoop(thick: number) {
        while (true) {
            yield new UnityEngine.WaitForSeconds(thick);

            // 룸이 없거나 룸에 연결되지 않은 경우가 없도록 예외처리
            if (this.room != null && this.room.IsConnected) {
                // 로컬 플레이어의 인스턴스 존재 여부를 판단
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                // 로컬플레이어의 인스턴스가 있으면 myPlayer 객체를 만들어 로컬 플레이어의 캐릭터 인스턴스를 받아온다
                if (hasPlayer) {
                    const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                    // 캐릭터의 현재상태가 idle이 아니면 움직이고 있다는 뜻이기 때문에 transform을 전송해준다
                    if (myPlayer.character.CurrentState != CharacterState.Idle) {
                        // transform 전송 함수
                        this.SendTransform(myPlayer.character.transform);
                    }
                }
            }
        }
    }

    // Schema타입의 Vector3를 인자로 받아와 UnityEngine의 Vector3로 변환해 값을 반환시켜줌
    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3 (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }
}