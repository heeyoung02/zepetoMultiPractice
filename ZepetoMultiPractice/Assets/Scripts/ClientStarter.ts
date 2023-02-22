import { CharacterState, SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { Player, State, Vector3 } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import * as UnityEngine from 'UnityEngine';

export default class ClientStarter extends ZepetoScriptBehaviour {

    public multiPlay: ZepetoWorldMultiplay;
    private room: Room;

    // Ŭ���̾�Ʈ �������� sessionID�� player��ü�� �����Ұ��̱� ������ key - string / value - Player
    private currentPlayers: Map<string, Player> = new Map<string, Player>();

    Start() {
        // ���� �����ǰ� ���� �����Ҷ� ȣ��. ���� ���ڷ� ����
        this.multiPlay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        // �뿡 ���ӵǸ� ȣ��. ���� ���ڷ� ����
        this.multiPlay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        }

        this.StartCoroutine(this.SendMessageLoop(0.1));

    }

    private OnStateChange(state: State, isFirst: bool) {
        // ������ �÷��̾ �̺�Ʈ ������ ���(ó�� �ѹ��� ����ϸ� ��)
        if (isFirst) {
            // LocalPlayer �ν��Ͻ��� Scene�� ������ �ε�Ǿ����� ȣ��
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
                // character�� �÷��̿��� �������� ������ ���� CharacterController�� ���Ե� ������Ʈ��. cur�� CharacterStateŸ����
                myPlayer.character.OnChangedState.AddListener((cur, prev) => {
                    // �̺�Ʈ�� �߻��� �� ���� ĳ���� State�� ������ �����ϱ� ���� �Լ�
                    this.SendState(cur);
                });
            });

            // �ٸ� ĳ���� ��ġ ���۹ޱ�
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                // �����÷��̾ �ƴ� ��쿡�� ������Ʈ
                const isLocal = this.room.SessionId === sessionId;
                if (!isLocal) {
                    const player: Player = this.currentPlayers.get(sessionId);
                    player.OnChange += (ChangeValues) => this.OnUpdatePlayer(sessionId, player);
                }
            });
        }

        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);

        // RoomState�� ����Ǿ� �ִ� �÷��̾� ������ ��ȸ (ForEach �޼ҵ�� �迭 ��Ҹ� �ϳ��� ��ȸ�ϸ� �ݹ� �Լ��� �����Ѵ�)
        state.players.ForEach((sessionId: string, player: Player) => {
            // currentPlayers�� ���ڷ� ���� client�� sessionId�� ������ ���� �ʴٸ�, ���� ������ �÷��̾��̹Ƿ� set���� join�� ���
            if (!this.currentPlayers.has(sessionId))
                join.set(sessionId, player);
            // ������ �÷��̾ leave�� ������ ��
            leave.delete(sessionId);
        });

        // Room�� ���ο� �÷��̾ ������ �� �̺�Ʈ�� ���� �� �ְ� player ��ü�� OnJoinPlayer �̺�Ʈ ����
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // Room���� ������ ��� player �ν��Ͻ��� ����
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayers(sessionId, player));
    }

    private OnJoinPlayer(sessionId: string, player: Player) {
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        // �뿡 ������ �÷��̾� ������ ���� ���� ������ �÷��̾ currentPlayers�� ���
        this.currentPlayers.set(sessionId, player);
        // �÷��̾� �ν��Ͻ� �ʱ� Transform ������ ���� spawnInfo ��ü�� ����
        const spawnInfo = new SpawnInfo();
        // position�� rotation �� ����
        const position = new UnityEngine.Vector3(0, 0, 0);
        const rotation = new UnityEngine.Vector3(0, 0, 0);
        // spawnInfo�� ������ position�� rotation�� ����
        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);
        // �÷��̾� �ν��Ͻ� �����Լ��� ȣ���ϱ� �� isLocal����� �����Ͽ� �� ����
        const isLocal = this.room.SessionId === player.sessionId; // ===�� ��ġ �����ڷ� ���� ������ Ÿ�� ��� ��ġ�ϴ°�� true ��ȯ

        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    // �÷��̾� ���� ����
    private OnLeavePlayers(sessionId: string, player: Player) {
        console.log(`[OnLeave] players - sessionId : ${sessionId}`);
        // ������ �÷��̾� currentPlayers��Ͽ��� �����ϱ�
        this.currentPlayers.delete(sessionId);
        // �÷��̾� �ν��Ͻ� ����
        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private OnUpdatePlayer(sessionId: string, player: Player) {
        // �����ǰ� �޾ƿ���
        const position = this.ParseVector3(player.transform.position);
        // ��ġ�� ������Ʈ�� �÷��̾� �޾ƿ���
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        // ĳ���� ��ġ �̵���Ű��
        zepetoPlayer.character.MoveToPosition(position);
        // ���� ����ȭ
        if (player.state === CharacterState.JumpIdle || player.state === CharacterState.JumpMove)
            zepetoPlayer.character.Jump();
    }

    private SendState(state: CharacterState) {
        // ������ ������ ������ Ÿ��
        const data = new RoomData();
        // ���� ĳ������ State �߰� (CharacterState�� ZEPETO.Character.Controller�� ���ǵ� enumŸ���̴�.)
        //enum CharacterState { Invalid = 0, Idle = 1, Walk = 2, Run = 3, JumpIdle = 4, JumpMove = 5, Teleport = 20, Gesture = 30, Move = 102, MoveTurn = 103, Jump = 104, Stamp = 106, Falling = 108, Landing = 109 }
        data.Add("state", state);
        // Ŭ���̾�Ʈ���� ������ �޼����� �۽��ϴ� �Լ�
        this.room.Send("onChangedState", data.GetObject());
    }

    private SendTransform(transform: UnityEngine.Transform) {
        const data = new RoomData();

        // position ���� �־��� �뵥���� ��ü
        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());

        // rotation ���� �־��� �뵥���� ��ü
        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());

        // data�޼��� ���� (���Ͱ��� ������� ���� ������ ĳ���� ���¿� �κ��丮 ���� ���� ������ ���� ����)
        this.room.Send("onChangedTransform", data.GetObject());
    }

    private * SendMessageLoop(thick: number) {
        while (true) {
            yield new UnityEngine.WaitForSeconds(thick);

            // ���� ���ų� �뿡 ������� ���� ��찡 ������ ����ó��
            if (this.room != null && this.room.IsConnected) {
                // ���� �÷��̾��� �ν��Ͻ� ���� ���θ� �Ǵ�
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                // �����÷��̾��� �ν��Ͻ��� ������ myPlayer ��ü�� ����� ���� �÷��̾��� ĳ���� �ν��Ͻ��� �޾ƿ´�
                if (hasPlayer) {
                    const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                    // ĳ������ ������°� idle�� �ƴϸ� �����̰� �ִٴ� ���̱� ������ transform�� �������ش�
                    if (myPlayer.character.CurrentState != CharacterState.Idle) {
                        // transform ���� �Լ�
                        this.SendTransform(myPlayer.character.transform);
                    }
                }
            }
        }
    }

    // SchemaŸ���� Vector3�� ���ڷ� �޾ƿ� UnityEngine�� Vector3�� ��ȯ�� ���� ��ȯ������
    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3 (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }
}