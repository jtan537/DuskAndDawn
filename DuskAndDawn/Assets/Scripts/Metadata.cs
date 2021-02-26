using System.Collections;
using System.Collections.Generic;
using Cinemachine;
using UnityEngine;

public class Metadata : MonoBehaviour
{
    // Start is called before the first frame update

    [SerializeField]
    CinemachineVirtualCamera duskCam1;
    [SerializeField]
    CinemachineVirtualCamera duskCam2;
    [SerializeField]
    CinemachineVirtualCamera dawnCam1;
    [SerializeField]
    CinemachineVirtualCamera dawnCam2;
    [SerializeField]
    NPCInteract duskNPCInteract, dawnNPCInteract;

    public bool dawnInDialog, duskInDialog;
    public CinemachineVirtualCamera duskCurrentCamera;
    public CinemachineVirtualCamera dawnCurrentCamera;
    public GameObject curPlayer;

    private void Update()
    {
        dawnInDialog = dawnNPCInteract.isInDialog;
        duskInDialog = duskNPCInteract.isInDialog;
    }

    public CinemachineVirtualCamera getDuskCam1()
    {
        return duskCam1;
    }

    public CinemachineVirtualCamera getDuskCam2()
    {
        return duskCam2;
    }

    public CinemachineVirtualCamera getDawnCam1()
    {
        return dawnCam1;
    }

    public CinemachineVirtualCamera getDawnCam2()
    {
        return dawnCam2;
    }

    public GameObject getCurPlayer()
    {
        return curPlayer;
    }

    public void setCurPlayer(GameObject player)
    {
        curPlayer = player;
    }

    public CinemachineVirtualCamera getDuskCurrentCamera()
    {
        return duskCurrentCamera;
    }

    public CinemachineVirtualCamera getDawnCurrentCamera()
    {
        return dawnCurrentCamera;
    }

    public void setDuskCurrentCamera(CinemachineVirtualCamera virtualCamera)
    {
        duskCurrentCamera = virtualCamera;
    }

    public void setDawnCurrentCamera(CinemachineVirtualCamera virtualCamera)
    {
        dawnCurrentCamera = virtualCamera;
    }
}
