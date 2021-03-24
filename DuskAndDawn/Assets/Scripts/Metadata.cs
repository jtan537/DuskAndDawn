using System.Collections;
using System.Collections.Generic;
using Cinemachine;
using UnityEngine;

using UnityEngine.SceneManagement;

public class Metadata : MonoBehaviour
{
    // Start is called before the first frame update

    [SerializeField]
    CinemachineVirtualCamera[] duskCameras;
    [SerializeField]
    CinemachineVirtualCamera[] dawnCameras;
    [SerializeField]
    NPCInteract duskNPCInteract, dawnNPCInteract;

    public bool dawnInDialog, duskInDialog;
    public CinemachineVirtualCamera duskCurrentCamera;
    public CinemachineVirtualCamera dawnCurrentCamera;
    public GameObject curPlayer;

    int countIceHack = 0;

    private void Update()
    {
        dawnInDialog = dawnNPCInteract.isInDialog;
        duskInDialog = duskNPCInteract.isInDialog;

        if (Input.GetKeyDown("l"))
        {
            countIceHack += 1;
        }

        if (countIceHack >= 3)
        {
            SceneManager.LoadScene(sceneName: "IceSlidingPuzzle");
        }
    }

    public CinemachineVirtualCamera getDuskCam(int camNumber)
    {
        return duskCameras[camNumber - 1];
    }

    public CinemachineVirtualCamera getDawnCam(int camNumber)
    {
        return dawnCameras[camNumber - 1];
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
