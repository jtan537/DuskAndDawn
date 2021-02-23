using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Cinemachine;

public class CameraController : MonoBehaviour
{
	public Animator ani;
    private bool isDusk2Dawn = false;
	public Transform duskCamera;
	public Transform dawnCamera;
    public GameObject dusk;
    public GameObject dawn;
    public GameObject duskInventory;
    public GameObject dawnInventory;

	void Start()
	{
		ani.SetBool("front", true);
        ani.SetBool("back", true);
        ani.SetBool("Dusk2Dawn", false);
        ani.SetBool("Dawn2Dusk", true);
        dusk.GetComponent<ThirdPersonMovement>().enabled = false;
        dawn.GetComponent<ThirdPersonMovement>().enabled = true;
        dawnInventory.SetActive(true);
        duskInventory.SetActive(false);
	}

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("r"))
        {
        	if (isDusk2Dawn)   // Dusk
            {
                ani.SetBool("Dusk2Dawn", true);
                ani.SetBool("Dawn2Dusk", false);
                ani.SetTrigger("Dusk2DawnTrigger");
                isDusk2Dawn = false;
                dusk.GetComponent<ThirdPersonMovement>().enabled = false;
                dawn.GetComponent<ThirdPersonMovement>().enabled = true;
                dawnInventory.SetActive(true);
                duskInventory.SetActive(false);
            }
            else    // Dawn
            {
                ani.SetBool("Dusk2Dawn", false);
                ani.SetBool("Dawn2Dusk", true);
                ani.SetTrigger("Dawn2DuskTrigger");
                isDusk2Dawn = true;
                dusk.GetComponent<ThirdPersonMovement>().enabled = true;
                dawn.GetComponent<ThirdPersonMovement>().enabled = false;
                dawnInventory.SetActive(false);
                duskInventory.SetActive(true);
            }
        }
    }
}
