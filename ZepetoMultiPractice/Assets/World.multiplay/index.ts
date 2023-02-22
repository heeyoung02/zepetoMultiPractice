import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import { Player, Transform, Vector3 } from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {

    // ���� �����ɶ� 1ȸ ȣ��. �� �ʱ�ȭ ���� �ۼ�
    onCreate(options: SandboxOptions) {

        // ���� Ŭ���̾�Ʈ�� ��ġ�� ���Ź޴� �޽��� ������
        this.onMessage?.("onChangedTransform", (client, message) => {
            // transform�� ����� player �ҷ�����
            const player = this.state.players.get(client.sessionId);

            // �޾ƿ� ��ġ �޽����� ��� ���� transform��ü ����
            const transform = new Transform();
            transform.position = new Vector3();

            // �޽������� ������ �� �־��ֱ�
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            // �ϼ��� transform�� player�� transform�� �����ϱ�
            //player.transform = transform;
            if (player != undefined)
                player.transform = transform;
        });

        // Ŭ���̾�Ʈ�κ��� ���ŵ� �޼����� Ȯ���ϱ� ���� �ݹ� ���
        this.onMessage?.("onChangedState", (client, message) => {
            // �޽����� ���� �÷��̾� ���� �ҷ�����
            const player = this.state.players.get(client.sessionId);
            // Ŭ���̾�Ʈ���� �޼����� state Ÿ������ CharacterState�� ���������Ƿ� ������ ���� ����
            //player.state = message.state;
            if (player != undefined)
                player.state = message.state;
        });
    }

    // �� �ڷᱸ�� - Ŭ���̾�Ʈ Ű : sessionId, �� : client
    //private map = new Map<string, SandboxPlayer>();

    // Ŭ���̾�Ʈ�� �뿡 ������ �� ȣ�� (Ŭ���̾�Ʈ�� ID �� ĳ���� ������ SandboxPlayer��ü�� ���ԵǾ� ����)
    async onJoin(client: SandboxPlayer) {
        //this.map.set(client.sessionId, client);
        //console.log(this.map.size); // �뿡 ������ Ŭ���̾�Ʈ ��
        console.log(`[On Join] sessionID : ${client.sessionId}, HashCode : ${client.hashCode}, UserID : ${client.userId}`);

        // schema�� ������ player ���� - Ŭ���̾�Ʈ ���� ����
        const player = new Player();
        player.sessionId = client.sessionId;
        if (client.hashCode)
            player.zepetoHash = client.hashCode;
        if (client.userId)
            player.zepetoUserId = client.userId;

        // Ŭ���̾�Ʈ�� �湮 Ƚ���� �����ͽ��丮���� �̿��Ͽ� ���� �� ����
        const storage: DataStorage | undefined = client.loadDataStorage?.();
        if (storage != undefined) {
            let visitCnt = await storage.get("VisitCount") as number;
            if (visitCnt == null) visitCnt = 0;
            console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visitCnt}`);
            await storage.set("VisitCount", ++visitCnt);
        }

        this.state.players.set(client.sessionId, player); // RoomState�� �����ߴ� players�� ����.
    }

    // Ŭ���̾�Ʈ�� �뿡�� ������ �� ȣ�� (consented�� Ŭ���̾�Ʈ�� ���� ������ ��û�� ��� true, �׷��� ������ false�� ������)
    onLeave(client: SandboxPlayer, consented?: boolean) {
        // ������ player�� Room���� �����ϴ� State�� players ��Ͽ��� ����
        this.state.players.delete(client.sessionId);
    }

    // sendboxOption���� ������ tickInterval���� �ݺ������� ȣ��
    onTick(deltaTime: number) {

    }
}