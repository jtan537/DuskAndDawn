using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SwitchCamera : MonoBehaviour
{
    public Animator ani;

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("r"))
        {
        	if (ani.GetBool("Transition"))
            {
                ani.SetBool("Transition", false);
            }
            else
            {
                ani.SetBool("Transition", true);
            }
        }
    }
}
