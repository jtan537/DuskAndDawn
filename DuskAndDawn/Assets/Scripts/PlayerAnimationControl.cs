using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerAnimationControl : MonoBehaviour
{
    Metadata metadata;
    Animator _anim;
    void Start()
    {
        metadata = GameObject.FindObjectOfType<Metadata>();
        _anim = gameObject.GetComponent<Animator>();
    }

    // Update is called once per frame
    void Update()
    {
        if (gameObject.tag == metadata.getCurPlayer().name)
        {
            _anim.SetBool("isCurPlayer", true);
        } else
        {
            _anim.SetBool("isCurPlayer", false);
        }
    }
}
