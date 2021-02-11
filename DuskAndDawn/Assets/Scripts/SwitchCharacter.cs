using System.Collections;
using System.Collections.Generic;
using Cinemachine;
using UnityEngine;

public class SwitchCharacter : MonoBehaviour
{

    public CameraController cameras;
    CinemachineVirtualCamera currentduskCamera;
    CinemachineVirtualCamera currentdawnCamera;

    

    public GameObject dusk;
    public GameObject dawn;

    GameObject currentCharacter;
    // Start is called before the first frame update
    void Start()
    {
        currentCharacter = dawn;
        currentduskCamera = cameras.getDuskCurrentCamera();
        currentdawnCamera = cameras.getDawnCurrentCamera();
    }

    // Update is called once per frame
    void Update()
    {
        currentduskCamera = cameras.getDuskCurrentCamera();
        currentdawnCamera = cameras.getDawnCurrentCamera();
        if (Input.GetKeyDown("r"))
        {
            if (currentCharacter == dusk)
            {
                dusk.GetComponent<ThreeDMovement>().enabled = false;
                currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

                dawn.GetComponent<ThreeDMovement>().enabled = true;
                currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;

                cameras.setCurPlayer(dawn);
                currentCharacter = dawn;
            }
            else
            {
                dusk.GetComponent<ThreeDMovement>().enabled = true;
                currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;

                dawn.GetComponent<ThreeDMovement>().enabled = false;
                currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

                currentCharacter = dusk;
                cameras.setCurPlayer(dusk);
            }
        }
    }
}