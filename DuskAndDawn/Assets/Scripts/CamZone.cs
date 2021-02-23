using System.Collections;
using Cinemachine;
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(Collider))]
public class CamZone : MonoBehaviour
{

    [SerializeField]
    private CinemachineVirtualCamera camToSwitchTo = null;
    [SerializeField]
    private CinemachineVirtualCamera ogCamera = null;

    public CameraController cameras;
    GameObject curPlayer;
    CinemachineVirtualCamera curDuskCam;
    CinemachineVirtualCamera curDawnCam;

    // Start is called before the first frame update
    void Start()
    {
        camToSwitchTo.GetComponent<CinemachineVirtualCamera>().enabled = false;
        curDuskCam = cameras.getDuskCurrentCamera();
        curDawnCam = cameras.getDawnCurrentCamera();
        curPlayer = cameras.getCurPlayer();
    }

    private void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            camToSwitchTo.GetComponent<CinemachineVirtualCamera>().enabled = true;
            ogCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;
            if (other.gameObject.name == "Dawn_Test")
            {
                cameras.setDawnCurrentCamera(cameras.getDawnCam2());
            } else
            {
                cameras.setDuskCurrentCamera(cameras.getDuskCam2());
            }
        }

    }

    private void OnTriggerExit(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            ogCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;
            camToSwitchTo.GetComponent<CinemachineVirtualCamera>().enabled = false;
            if (other.gameObject.name == "Dawn_Test")
            {
                cameras.setDawnCurrentCamera(cameras.getDawnCam1());
            }
            else
            {
                cameras.setDuskCurrentCamera(cameras.getDuskCam1());
            }
        }
    }

    private void OnValidate()
    {
        GetComponent<Collider>().isTrigger = true;
    }
}
