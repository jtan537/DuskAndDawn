using System.Collections;
using Cinemachine;
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(Collider))]
public class CamZone : MonoBehaviour
{

    [SerializeField]
    private CinemachineVirtualCamera camToSwitchTo = null;

    public Metadata cameras;
    GameObject curPlayer;
    CinemachineVirtualCamera curDuskCam;
    CinemachineVirtualCamera curDawnCam;

    // Start is called before the first frame update
    void Start()
    {
        curDuskCam = cameras.getDuskCurrentCamera();
        curDawnCam = cameras.getDawnCurrentCamera();
        curPlayer = cameras.getCurPlayer();
    }


    private void OnTriggerEnter(Collider other)
    {
        curDuskCam = cameras.getDuskCurrentCamera();
        curDawnCam = cameras.getDawnCurrentCamera();
        curPlayer = cameras.getCurPlayer();
        if (curPlayer.name == gameObject.tag)
        {
            if (other.CompareTag("Player"))
            {
                // Do nothing if player re-enters camzone
                if (curDawnCam == camToSwitchTo || curDuskCam == camToSwitchTo)
                {
                    return;
                }

                if (other.gameObject.name == "Dawn")
                {
                    curDawnCam.GetComponent<CinemachineVirtualCamera>().enabled = false;
                    cameras.setDawnCurrentCamera(camToSwitchTo);
                }
                else
                {
                    curDuskCam.GetComponent<CinemachineVirtualCamera>().enabled = false;
                    cameras.setDuskCurrentCamera(camToSwitchTo);
                }
                camToSwitchTo.GetComponent<CinemachineVirtualCamera>().enabled = true;
            }

        }
    }
        

    private void OnValidate()
    {
        GetComponent<Collider>().isTrigger = true;
    }
}
